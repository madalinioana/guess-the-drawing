// server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const scores = new Map(); // roomId → Map<username, score>

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Stări joc
const gameState = new Map(); // roomId → { drawerId, currentWord, drawingTime, phase, timer }
const rooms = new Map();     // roomId → Set<socket.id>

// Generează un ID unic de 4 cifre
function generateRoomId() {
  let roomId;
  do {
    roomId = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(roomId));
  return roomId;
}
// Generează un ID unic de 4 cifre
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

io.on("connection", (socket) => {
  console.log("✅ Utilizator conectat:", socket.id);
  for (const [roomId, socketsSet] of rooms.entries()) {
    if (socketsSet.has(socket.id)) {
      socketsSet.delete(socket.id);
      io.to(roomId).emit("players-update", getUsers(roomId));
    }
  }
  // Creare cameră nouă
  socket.on("createRoom", (username) => {
    const roomId = generateRoomId();
    rooms.set(roomId, new Set([socket.id]));
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;
    if (!scores.has(roomId)) {
      scores.set(roomId, new Map());
    }
    scores.get(roomId).set(username, 0);

    socket.emit("roomCreated", roomId);
    io.to(roomId).emit("updateUsers", getUsers(roomId));
  });

   socket.on("kick-player", ({ targetId, roomId }) => {
     console.log("⚡ kick-player primit:", targetId, roomId);
    const room = rooms.get(roomId);
    if (room && room.has(targetId)) {
      io.to(targetId).emit("kicked");
      io.sockets.sockets.get(targetId)?.disconnect();
      room.delete(targetId);
      io.to(roomId).emit("players-update", getUsers(roomId));
      console.log(`Player ${targetId} was kicked from room ${roomId}`);
  }
});



  // Alăturare la cameră existentă
  socket.on("joinRoom", ({ roomId, username }) => {
    if (!rooms.has(roomId)) {
      socket.emit("error", "Camera nu există!");
      return;
    }
    
    rooms.get(roomId).add(socket.id);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;
    if (!scores.has(roomId)) {
      scores.set(roomId, new Map());
    }
    scores.get(roomId).set(username, 0);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);
    socket.username = username;

    io.to(roomId).emit("players-update", getUsers(roomId));

    socket.emit("roomJoined", {
      roomId,
      users: getUsers(roomId),
    });
    io.to(roomId).emit("updateUsers", getUsers(roomId));
  });

  // Începere joc → alegem un drawer și cerem cuvânt
  socket.on("startGame", (roomId) => {
    if (rooms.has(roomId) && rooms.get(roomId).size >= 2) {
      const players = Array.from(rooms.get(roomId));
      const drawerId = players[Math.floor(Math.random() * players.length)];
      const drawerSocket = io.sockets.sockets.get(drawerId);

      gameState.set(roomId, {
        drawerId,
        phase: "select-word",
      });
      io.to(roomId).emit('clear-board');
      // Drawer primește comanda de a alege cuvânt
      drawerSocket.emit("setPhase", { phase: "select-word" });
      // Toți ceilalți văd cine este drawer și așteaptă
      io.to(roomId).emit("setPhase", {
        phase: "select-word",
        drawer: drawerSocket.username,
      });
    }
  });

  // Drawer trimite cuvântul ales
  socket.on("select-word", (word) => {
    const roomId = socket.roomId;
    const state = gameState.get(roomId);
    if (!state || state.drawerId !== socket.id || state.phase !== "select-word") return;

    state.currentWord = word.toLowerCase();
    state.drawingTime = 60;
    state.phase = "drawing";

    // Anunțăm începutul fazei de desen
    socket.emit("setPhase", { phase: "drawing", word: word, time: state.drawingTime });
    io.to(roomId).emit("setPhase", {
      phase: "drawing",
      drawer: socket.username,
      time: state.drawingTime,
    });

    // Pornim timer-ul
    state.timer = setInterval(() => {
      state.drawingTime--;
      io.to(roomId).emit("timeUpdate", { time: state.drawingTime });

      if (state.drawingTime <= 0) {
        clearInterval(state.timer);
        endRound(roomId);
      }
    }, 1000);
  });

  // Chat + detectare ghicit
  socket.on("message", (message) => {
    const roomId = socket.roomId;
    const state = gameState.get(roomId);
    if (!roomId) return;

    // Broadcast mesaj
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
      const drawerSocket = io.sockets.sockets.get(state.drawerId);
      const guesserName = socket.username;
      const drawerName = drawerSocket?.username;
      const roomScores = scores.get(roomId);
      const maxTime = 60; // timpul inițial
      const timeLeft = state.drawingTime;

      const guesserScore = Math.ceil(10 * (timeLeft / maxTime)); // direct proporțional
      const drawerScore = Math.ceil(10 * ((maxTime - timeLeft) / maxTime)); // invers proporțional

      // ✅ Scoruri
      if (roomScores) {
        roomScores.set(guesserName, (roomScores.get(guesserName) || 0) + guesserScore);
        if (drawerName) {
          roomScores.set(drawerName, (roomScores.get(drawerName) || 0) + drawerScore);
        }
        io.to(roomId).emit("updateScores", Array.from(roomScores.entries()));
      }

      io.to(roomId).emit("correctGuess", {
        username: guesserName,
        word: state.currentWord,
      });

      clearInterval(state.timer);
      endRound(roomId);
    }

  });

  // Desen: doar broadcast pentru ceilalți
  socket.on("send-drawing", (data) => {
    const roomId = socket.roomId;
    if (roomId) {
      socket.broadcast.to(roomId).emit("receive-drawing", data);
    }
  });

  // Ștergere desen
  socket.on("clear-board", () => {
    const roomId = socket.roomId;
    if (roomId) socket.broadcast.to(roomId).emit("clear-board");
  });

  // Disconectare user
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

// Terminarea rundei
function endRound(roomId) {
  const state = gameState.get(roomId);
  if (!state) return;
  const drawerSocket = io.sockets.sockets.get(state.drawerId);

  io.to(roomId).emit("roundEnded", {
    drawer: drawerSocket?.username,
    word: state.currentWord,
  });

  gameState.delete(roomId);
}

server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});
