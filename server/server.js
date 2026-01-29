const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
});

const scores = new Map();
const gameState = new Map();
const rooms = new Map();
const creators = new Map();

// Persistent user storage with JSON file
const USERS_FILE = path.join(__dirname, "users.json");
const users = new Map();
let userIdCounter = 1;

// Load users from file on startup
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf8");
      const parsed = JSON.parse(data);
      parsed.users.forEach(user => {
        users.set(user.id, user);
      });
      userIdCounter = parsed.userIdCounter || 1;
      console.log(`Loaded ${users.size} users from storage`);
    }
  } catch (error) {
    console.error("Error loading users:", error);
  }
}

// Save users to file
function saveUsers() {
  try {
    const data = {
      users: Array.from(users.values()),
      userIdCounter
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving users:", error);
  }
}

// Load users on server start
loadUsers();

// Authentication endpoints
app.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      u => u.username === username || u.email === email
    );

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username === username 
          ? "Username already exists" 
          : "Email already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = userIdCounter++;
    const newUser = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      avatar: "😀", // Default avatar
      createdAt: new Date()
    };

    users.set(userId, newUser);
    saveUsers(); // Persist to file

    // Generate token
    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "User registered successfully",
      userId,
      username,
      email,
      avatar: newUser.avatar,
      token
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user
    const user = Array.from(users.values()).find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      userId: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || "😀",
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

app.post("/auth/verify", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      userId: user.id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

app.patch("/auth/profile/:userId", (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const updates = req.body;

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update allowed fields
    if (updates.avatar !== undefined) {
      user.avatar = updates.avatar;
    }

    users.set(userId, user);
    saveUsers();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
});


function generateRoomId() {
  let roomId;
  do {
    roomId = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(roomId));
  return roomId;
}

function getUsers(roomId) {
  const ids = rooms.get(roomId) || new Set();
  return Array.from(ids)
    .map((id) => {
      const s = io.sockets.sockets.get(id);
      if (!s) return null;
      
      // Include avatar if user is registered
      let avatar = "👤"; // Default for guests
      if (s.userId) {
        const user = users.get(s.userId);
        if (user && user.avatar) {
          avatar = user.avatar;
        }
      }
      
      return { 
        id, 
        name: s.username,
        avatar: avatar
      };
    })
    .filter(Boolean);
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  for (const [roomId, socketsSet] of rooms.entries()) {
    if (socketsSet.has(socket.id)) {
      socketsSet.delete(socket.id);
      io.to(roomId).emit("players-update", getUsers(roomId));
    }
  }

  socket.on("createRoom", (data) => {
    const username = typeof data === "string" ? data : data.username;
    const userId = typeof data === "object" ? data.userId : null;
    
    const roomId = generateRoomId();
    rooms.set(roomId, new Set([socket.id]));
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;
    socket.userId = userId;

    if (!scores.has(roomId)) scores.set(roomId, new Map());
    scores.get(roomId).set(username, 0);
    creators.set(roomId, socket.id);

    socket.emit("roomCreated", roomId);
    io.to(roomId).emit("updateUsers", getUsers(roomId));
  });

  socket.on("joinRoom", ({ roomId, username, userId }) => {
    if (!rooms.has(roomId)) {
      socket.emit("error", "Room does not exist!");
      return;
    }

    rooms.get(roomId).add(socket.id);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;
    socket.userId = userId || null;

    if (!scores.has(roomId)) scores.set(roomId, new Map());
    scores.get(roomId).set(username, 0);

    io.to(roomId).emit("players-update", getUsers(roomId));
    io.to(roomId).emit("updateUsers", getUsers(roomId));

    socket.emit("roomJoined", {
      roomId,
      users: getUsers(roomId),
    });
  });

  socket.on("startGame", (roomId) => {
    if (rooms.has(roomId) && rooms.get(roomId).size >= 2) {
      const players = Array.from(rooms.get(roomId));
      const drawerId = players[Math.floor(Math.random() * players.length)];
      const drawerSocket = io.sockets.sockets.get(drawerId);

      gameState.set(roomId, {
        drawerId,
        phase: "select-word",
      });

      io.to(roomId).emit("clear-board");

      drawerSocket.emit("setPhase", { phase: "select-word" });
      io.to(roomId).emit("setPhase", {
        phase: "select-word",
        drawer: drawerSocket.username,
      });
    }
  });

  socket.on("select-word", (word) => {
    const roomId = socket.roomId;
    const state = gameState.get(roomId);
    if (!state || state.drawerId !== socket.id || state.phase !== "select-word") return;

    state.currentWord = word.toLowerCase();
    state.drawingTime = 60;
    state.phase = "drawing";

    socket.emit("setPhase", { phase: "drawing", word: word, time: state.drawingTime });
    io.to(roomId).emit("setPhase", {
      phase: "drawing",
      drawer: socket.username,
      time: state.drawingTime,
    });

    state.timer = setInterval(() => {
      state.drawingTime--;
      io.to(roomId).emit("timeUpdate", { time: state.drawingTime });
      if (state.drawingTime <= 0) {
        clearInterval(state.timer);
        endRound(roomId);
      }
    }, 1000);
  });

  socket.on("message", (message) => {
    const roomId = socket.roomId;
    const state = gameState.get(roomId);
    if (!roomId) return;

    io.to(roomId).emit("message", {
      username: socket.username,
      message,
    });

    if (
      state &&
      state.phase === "drawing" &&
      socket.id !== state.drawerId &&
      message.trim().toLowerCase() === state.currentWord
    ) {
      const guesserName = socket.username;
      const drawerSocket = io.sockets.sockets.get(state.drawerId);
      const drawerName = drawerSocket?.username;
      const roomScores = scores.get(roomId);

      if (!state.guessedPlayers) state.guessedPlayers = new Set();
      if (state.guessedPlayers.has(guesserName)) return;

      state.guessedPlayers.add(guesserName);

      const maxTime = 60;
      const timeLeft = state.drawingTime;

      const guesserScore = Math.ceil(10 * (timeLeft / maxTime));
      const drawerScore = Math.ceil(10 * ((maxTime - timeLeft) / maxTime));

      if (roomScores) {
        roomScores.set(guesserName, (roomScores.get(guesserName) || 0) + guesserScore);
        io.to(roomId).emit("updateScores", Array.from(roomScores.entries()));
      }

      io.to(roomId).emit("correctGuess", {
        username: guesserName,
        word: state.currentWord,
      });

      const totalPlayers = getUsers(roomId).filter((u) => u.name !== drawerName).length;
      if (state.guessedPlayers.size === totalPlayers) {
        clearInterval(state.timer);
        endRound(roomId, drawerScore);
      }
    }
  });

  socket.on("send-drawing", (data) => {
    const roomId = socket.roomId;
    if (roomId) socket.broadcast.to(roomId).emit("receive-drawing", data);
  });

  socket.on("clear-board", () => {
    const roomId = socket.roomId;
    if (roomId) socket.broadcast.to(roomId).emit("clear-board");
  });

  socket.on("kick-player", ({ targetId, roomId }) => {
    const room = rooms.get(roomId);
    const targetSocket = io.sockets.sockets.get(targetId);

    if (room && room.has(targetId)) {
      const username = targetSocket?.username;

      io.to(targetId).emit("kicked");
      targetSocket?.disconnect();
      room.delete(targetId);

      const roomScores = scores.get(roomId);
      if (roomScores && username) {
        roomScores.delete(username);
        io.to(roomId).emit("updateScores", Array.from(roomScores.entries()));
      }

      io.to(roomId).emit("players-update", getUsers(roomId));
      console.log(`Player ${targetId} (${username}) was kicked from room ${roomId}`);
    }
  });

  socket.on("leave-room", () => {
    const roomId = socket.roomId;
    const username = socket.username;

    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.delete(socket.id);

      const roomScores = scores.get(roomId);
      if (roomScores && username) {
        roomScores.delete(username);
        io.to(roomId).emit("updateScores", Array.from(roomScores.entries()));
      }

      if (creators.get(roomId) === socket.id) {
        const nextCreator = Array.from(room)[0];
        if (nextCreator) {
          creators.set(roomId, nextCreator);
          const newCreatorSocket = io.sockets.sockets.get(nextCreator);
          const newCreatorName = newCreatorSocket?.username || "";

          io.to(roomId).emit("creator-changed", {
            socketId: nextCreator,
            username: newCreatorName,
          });
        } else {
          creators.delete(roomId);
        }
      }

      io.to(roomId).emit("players-update", getUsers(roomId));
      io.to(roomId).emit("updateUsers", getUsers(roomId));

      socket.leave(roomId);
      delete socket.roomId;
      delete socket.username;

      console.log(`${username} left room ${roomId}`);
    }
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(socket.id);
      io.to(roomId).emit("updateUsers", getUsers(roomId));
      if (rooms.get(roomId).size === 0) rooms.delete(roomId);
    }
    console.log("User disconnected:", socket.id);
  });
});
function endRound(roomId, drawerScore = 10) {
  const state = gameState.get(roomId);
  if (!state) return;

  const drawerSocket = io.sockets.sockets.get(state.drawerId);
  const drawerName = drawerSocket?.username;
  const roomScores = scores.get(roomId);


  const totalPlayers = getUsers(roomId).filter((u) => u.name !== drawerName).length;

  if (drawerName && roomScores) {
  
    const guessedCount = state.guessedPlayers?.size || 0;
    const proportion = totalPlayers > 0
      ? 1 - (guessedCount / totalPlayers)
      : 1;

    const baseScore = typeof drawerScore === "number" ? drawerScore : 10;
    const drawerPoints = Math.ceil(proportion * baseScore);

    roomScores.set(
      drawerName,
      (roomScores.get(drawerName) || 0) + drawerPoints
    );

    io.to(roomId).emit("updateScores", Array.from(roomScores.entries()));
  }
  io.to(roomId).emit("roundEnded", {
    drawer: drawerName,
    word: state.currentWord,
  });

  gameState.delete(roomId);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
