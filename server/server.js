const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const scores = new Map();   // roomId → Map<username, score>
const gameState = new Map(); // roomId → {...}
const rooms = new Map();     // roomId → Set<socket.id>
const creators = new Map();  // roomId → socket.id (creator)

// === Funcții utile ===
function generateRoomId() {
  let roomId;
  do {
    roomId = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(roomId));
  return roomId;
}

function getUsers(roomId) {
  const ids = rooms.get(roomId) || new Set();
  return Array.from(ids).map(id => {
    const s = io.sockets.sockets.get(id);
    return s ? { id, name: s.username } : null;
  }).filter(Boolean);
}

// === Logica socket ===
io.on("connection", (socket) => {
  console.log("✅ Utilizator conectat:", socket.id);

  // Curățare din camere vechi
  for (const [roomId, socketsSet] of rooms.entries()) {
    if (socketsSet.has(socket.id)) {
      socketsSet.delete(socket.id);
      io.to(roomId).emit("players-update", getUsers(roomId));
    }
  }

  // === Creare cameră ===
  socket.on("createRoom", (username) => {
    const roomId = generateRoomId();
    rooms.set(roomId, new Set([socket.id]));
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;

    // Init scoruri și creator
    if (!scores.has(roomId)) scores.set(roomId, new Map());
    scores.get(roomId).set(username, 0);
    creators.set(roomId, socket.id);

    socket.emit("roomCreated", roomId);
    io.to(roomId).emit("updateUsers", getUsers(roomId));
  });

  // === Alăturare cameră ===
  socket.on("joinRoom", ({ roomId, username }) => {
    if (!rooms.has(roomId)) {
      socket.emit("error", "Camera nu există!");
      return;
    }

    rooms.get(roomId).add(socket.id);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;

    if (!scores.has(roomId)) scores.set(roomId, new Map());
    scores.get(roomId).set(username, 0);

    io.to(roomId).emit("players-update", getUsers(roomId));
    io.to(roomId).emit("updateUsers", getUsers(roomId));

    socket.emit("roomJoined", {
      roomId,
      users: getUsers(roomId),
    });
  });

  // === Buton START JOC ===
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

  // === Alege cuvânt ===
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

  // === Chat + verificare ghicit ===
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

      const totalPlayers = getUsers(roomId).filter(u => u.name !== drawerName).length;
      if (state.guessedPlayers.size === totalPlayers) {
        clearInterval(state.timer);
        endRound(roomId, drawerScore);
      }
    }
  });

  // === Desenare și ștergere ===
  socket.on("send-drawing", (data) => {
    const roomId = socket.roomId;
    if (roomId) socket.broadcast.to(roomId).emit("receive-drawing", data);
  });

  socket.on("clear-board", () => {
    const roomId = socket.roomId;
    if (roomId) socket.broadcast.to(roomId).emit("clear-board");
  });

  // === Kick player ===
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

  // === Leave Room ===
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
          username: newCreatorName
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

      console.log(`${username} a părăsit camera ${roomId}`);
    }
  });

  // === Deconectare ===
  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(socket.id);
      io.to(roomId).emit("updateUsers", getUsers(roomId));
      if (rooms.get(roomId).size === 0) rooms.delete(roomId);
    }
    console.log("❌ Utilizator deconectat:", socket.id);
  });
});

// === Terminare rundă ===
function endRound(roomId, drawerScore) {
  const state = gameState.get(roomId);
  if (!state) return;

  const drawerSocket = io.sockets.sockets.get(state.drawerId);
  const drawerName = drawerSocket?.username;
  const roomScores = scores.get(roomId);
  const totalPlayers = getUsers(roomId).filter(u => u.name !== drawerName).length;

  if (drawerName && roomScores) {
    const guessedCount = state.guessedPlayers?.size || 0;
    const proportion = guessedCount / totalPlayers;
    const drawerPoints = Math.ceil(proportion * drawerScore);

    roomScores.set(drawerName, (roomScores.get(drawerName) || 0) + drawerPoints);
    io.to(roomId).emit("updateScores", Array.from(roomScores.entries()));
  }

  io.to(roomId).emit("roundEnded", {
    drawer: drawerName,
    word: state.currentWord,
  });

  gameState.delete(roomId);
}

server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});
