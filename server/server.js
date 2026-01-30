require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const crypto = require("crypto");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const connectDB = require("./config/db");
const User = require("./models/User");

const authRoutes = require("./routes/auth");
const leaderboardRoutes = require("./routes/leaderboard");
const friendsRoutes = require("./routes/friends");

const { sanitizeInput, sanitizeUsername } = require("./utils/sanitize");
const { isAllowed } = require("./middleware/rateLimiter");

connectDB();

const app = express();
const server = http.createServer(app);

const corsOrigin = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://guess-the-drawing-tau.vercel.app'
  ];

  if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    callback(null, true);
  } else {
    callback(new Error("CORS not allowed"));
  }
};

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/friends", friendsRoutes);

const io = new Server(server, {
  cors: corsOptions,
  maxHttpBufferSize: 1e6
});

const connections = new Map();
const MAX_CONNECTIONS_PER_IP = 5;

const scores = new Map();
const gameState = new Map();
const rooms = new Map();
const creators = new Map();
const onlineUsers = new Map();

function generateRoomId() {
  let roomId;
  do {
    roomId = crypto.randomBytes(4).toString("hex").toUpperCase();
  } while (rooms.has(roomId));
  return roomId;
}

function validateDrawingData(data) {
  if (!data || typeof data !== "object") return false;
  if (data.x !== undefined && (typeof data.x !== "number" || data.x < 0 || data.x > 2000)) return false;
  if (data.y !== undefined && (typeof data.y !== "number" || data.y < 0 || data.y > 2000)) return false;
  if (data.lineWidth !== undefined && (typeof data.lineWidth !== "number" || data.lineWidth < 1 || data.lineWidth > 50)) return false;
  if (data.color !== undefined && typeof data.color !== "string") return false;
  return true;
}

function getUsers(roomId) {
  const ids = rooms.get(roomId) || new Set();
  return Array.from(ids)
    .map((id) => {
      const s = io.sockets.sockets.get(id);
      if (!s) return null;
      return {
        id,
        name: s.username,
        avatar: s.avatar || "👤",
        userId: s.userId || null
      };
    })
    .filter(Boolean);
}

async function updateUserStats(userId, statsUpdate) {
  if (!userId) return;
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: statsUpdate
    });
  } catch (error) {
    console.error("Failed to update user stats:", error);
  }
}

io.use((socket, next) => {
  const ip = socket.handshake.address;
  const count = connections.get(ip) || 0;
  
  if (count >= MAX_CONNECTIONS_PER_IP) {
    return next(new Error("Too many connections from this IP"));
  }
  
  connections.set(ip, count + 1);
  
  socket.on("disconnect", () => {
    const currentCount = connections.get(ip) || 1;
    if (currentCount <= 1) {
      connections.delete(ip);
    } else {
      connections.set(ip, currentCount - 1);
    }
  });
  
  next();
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  for (const [roomId, socketsSet] of rooms.entries()) {
    if (socketsSet.has(socket.id)) {
      socketsSet.delete(socket.id);
      io.to(roomId).emit("players-update", getUsers(roomId));
    }
  }

  socket.on("register-user", (userId) => {
    if (userId) {
      socket.registeredUserId = userId;
      onlineUsers.set(userId, socket.id);
    }
  });

  socket.on("get-friends-online", (friendUserIds) => {
    if (!Array.isArray(friendUserIds)) return;
    const onlineStatuses = {};
    friendUserIds.forEach(friendId => {
      onlineStatuses[friendId] = onlineUsers.has(friendId);
    });
    socket.emit("friends-online-status", onlineStatuses);
  });

  socket.on("invite-to-room", ({ targetUserId, roomId }) => {
    const targetSocketId = onlineUsers.get(targetUserId);
    if (!targetSocketId) {
      socket.emit("invite-error", { message: "Friend is not online" });
      return;
    }

    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (!targetSocket) {
      socket.emit("invite-error", { message: "Friend is not online" });
      return;
    }

    targetSocket.emit("room-invite", {
      roomId,
      fromUsername: socket.username,
      fromAvatar: socket.avatar || "👤",
      fromUserId: socket.userId
    });

    socket.emit("invite-sent", { targetUserId });
  });

  socket.on("createRoom", (data) => {
    if (!isAllowed(socket.id, "createRoom")) {
      socket.emit("error", "Too many rooms created. Please wait.");
      return;
    }

    const username = typeof data === "string" ? data : data?.username;
    const userId = typeof data === "object" ? data?.userId : null;
    const avatar = typeof data === "object" ? data?.avatar : "👤";

    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      socket.emit("error", "Invalid username");
      return;
    }

    const roomId = generateRoomId();
    rooms.set(roomId, new Set([socket.id]));
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = cleanUsername;
    socket.userId = userId;
    socket.avatar = avatar || "👤";

    if (!scores.has(roomId)) scores.set(roomId, new Map());
    scores.get(roomId).set(cleanUsername, 0);
    creators.set(roomId, socket.id);

    socket.emit("roomCreated", roomId);
    io.to(roomId).emit("updateUsers", getUsers(roomId));
  });

  socket.on("joinRoom", ({ roomId, username, userId, avatar }) => {
    if (!isAllowed(socket.id, "joinRoom")) {
      socket.emit("error", "Too many join attempts. Please wait.");
      return;
    }

    if (!rooms.has(roomId)) {
      socket.emit("error", "Room does not exist!");
      return;
    }

    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      socket.emit("error", "Invalid username");
      return;
    }

    rooms.get(roomId).add(socket.id);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = cleanUsername;
    socket.userId = userId || null;
    socket.avatar = avatar || "👤";

    if (!scores.has(roomId)) scores.set(roomId, new Map());
    scores.get(roomId).set(cleanUsername, 0);

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

    const cleanWord = sanitizeInput(word);
    if (!cleanWord) return;

    state.currentWord = cleanWord.toLowerCase();
    state.drawingTime = 60;
    state.phase = "drawing";

    socket.emit("setPhase", { 
      phase: "drawing", 
      word: cleanWord, 
      time: state.drawingTime,
      drawer: socket.username
    });
    
    const wordHint = cleanWord.replace(/[a-zA-Z0-9]/g, "_");
    socket.to(roomId).emit("setPhase", {
      phase: "drawing",
      drawer: socket.username,
      time: state.drawingTime,
      wordHint: wordHint,
      wordLength: cleanWord.length
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

    if (!isAllowed(socket.id, "message")) {
      socket.emit("rateLimited", "Too many messages. Please slow down.");
      return;
    }

    const cleanMessage = sanitizeInput(message);
    if (!cleanMessage) return;

    io.to(roomId).emit("message", {
      username: socket.username,
      message: cleanMessage,
    });

    if (
      state &&
      state.phase === "drawing" &&
      socket.id !== state.drawerId &&
      cleanMessage.trim().toLowerCase() === state.currentWord
    ) {
      const guesserName = socket.username;
      const guesserUserId = socket.userId;
      const drawerSocket = io.sockets.sockets.get(state.drawerId);
      const drawerName = drawerSocket?.username;
      const roomScores = scores.get(roomId);

      if (!state.guessedPlayers) state.guessedPlayers = new Map();
      if (state.guessedPlayers.has(guesserName)) return;

      const maxTime = 60;
      const timeLeft = state.drawingTime;

      const guesserScore = Math.ceil(10 * (timeLeft / maxTime));
      const drawerScore = Math.ceil(10 * ((maxTime - timeLeft) / maxTime));

      state.guessedPlayers.set(guesserName, { score: guesserScore, userId: guesserUserId });

      if (roomScores) {
        roomScores.set(guesserName, (roomScores.get(guesserName) || 0) + guesserScore);
        io.to(roomId).emit("updateScores", Array.from(roomScores.entries()));
      }

      if (guesserUserId) {
        updateUserStats(guesserUserId, {
          "stats.correctGuesses": 1,
          "stats.totalScore": guesserScore
        });
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
    if (!roomId) return;
    
    if (!isAllowed(socket.id, "drawing")) return;
    if (!validateDrawingData(data)) return;
    
    const state = gameState.get(roomId);
    if (state && state.phase === "drawing" && socket.id !== state.drawerId) return;
    
    socket.broadcast.to(roomId).emit("receive-drawing", data);
  });

  socket.on("clear-board", () => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const state = gameState.get(roomId);
    if (state && state.phase === "drawing" && socket.id !== state.drawerId) return;
    
    socket.broadcast.to(roomId).emit("clear-board");
  });

  socket.on("kick-player", ({ targetId, roomId }) => {
    const room = rooms.get(roomId);
    
    if (!room || creators.get(roomId) !== socket.id) {
      socket.emit("error", { code: "UNAUTHORIZED", message: "Only the host can kick players" });
      return;
    }
    
    const targetSocket = io.sockets.sockets.get(targetId);

    if (room.has(targetId)) {
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
    }
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(socket.id);
      io.to(roomId).emit("updateUsers", getUsers(roomId));
      if (rooms.get(roomId).size === 0) rooms.delete(roomId);
    }

    if (socket.registeredUserId) {
      onlineUsers.delete(socket.registeredUserId);
    }

    console.log("User disconnected:", socket.id);
  });
});

async function endRound(roomId, drawerScore = 10) {
  const state = gameState.get(roomId);
  if (!state) return;

  const drawerSocket = io.sockets.sockets.get(state.drawerId);
  const drawerName = drawerSocket?.username;
  const drawerUserId = drawerSocket?.userId;
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

    if (drawerUserId) {
      await updateUserStats(drawerUserId, {
        "stats.drawingsCompleted": 1,
        "stats.totalScore": drawerPoints,
        "stats.gamesPlayed": 1
      });
    }

    if (state.guessedPlayers) {
      for (const [, guesserData] of state.guessedPlayers) {
        if (guesserData.userId) {
          await updateUserStats(guesserData.userId, {
            "stats.gamesPlayed": 1
          });
        }
      }
    }
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