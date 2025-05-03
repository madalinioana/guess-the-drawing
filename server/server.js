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

// Stări joc
const gameState = new Map(); // { roomId: { currentWord, drawerId, drawingTime, guessingTime, phase } }
const words = ["mar", "copac", "masina", "pisica", "telefon"];

// Camere și membri
const rooms = new Map(); // roomId → Set<socket.id>

// Helper pentru lista de utilizatori
function getUsers(roomId) {
  const ids = rooms.get(roomId) || new Set();
  return Array.from(ids).map(id => {
    const s = io.sockets.sockets.get(id);
    return s?.username || "Guest";
  });
}

// Generează un ID unic de 4 cifre
function generateRoomId() {
  let roomId;
  do {
    roomId = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(roomId));
  return roomId;
}

io.on("connection", (socket) => {
  console.log("✅ Utilizator conectat:", socket.id);

  // Creare cameră nouă
  socket.on("createRoom", (username) => {
    const roomId = generateRoomId();
    rooms.set(roomId, new Set([socket.id]));
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;

    socket.emit("roomCreated", roomId);
    io.to(roomId).emit("updateUsers", getUsers(roomId));
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

    socket.emit("roomJoined", {
      roomId,
      users: getUsers(roomId),
    });
    io.to(roomId).emit("updateUsers", getUsers(roomId));
  });

  // Începere joc
  socket.on("startGame", (roomId) => {
    if (rooms.has(roomId) && rooms.get(roomId).size >= 2) {
      startRound(roomId);
    }
  });

  // Chat
  socket.on("message", (message) => {
    const roomId = socket.roomId;
    if (roomId) {
      io.to(roomId).emit("message", {
        username: socket.username,
        message,
      });
    }
  });

  // Guessing
  socket.on("guess", (guess, callback) => {
    const roomId = socket.roomId;
    const state = gameState.get(roomId);
    if (!state || typeof callback !== "function") return;

    if (guess.toLowerCase() === state.currentWord.toLowerCase()) {
      io.to(roomId).emit("correctGuess", {
        username: socket.username,
        word: state.currentWord,
      });
      endRound(roomId);
      callback(true);
    } else {
      callback(false);
    }
  });

  // Desen: broadcast doar celorlalți din cameră
  socket.on("send-drawing", (data) => {
    const roomId = socket.roomId;
    if (roomId) {
      socket.broadcast.to(roomId).emit("receive-drawing", data);
    }
  });

  // Clear board
  socket.on("clear-board", () => {
    const roomId = socket.roomId;
    if (roomId) {
      socket.broadcast.to(roomId).emit("clear-board");
    }
  });

  // Deconectare
  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(socket.id);
      io.to(roomId).emit("updateUsers", getUsers(roomId));

      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }
    }
    console.log("❌ Utilizator deconectat:", socket.id);
  });
});

// --------- Logica rundei ---------

function startRound(roomId) {
  const players = Array.from(rooms.get(roomId));
  const drawerId = players[Math.floor(Math.random() * players.length)];
  const drawerSocket = io.sockets.sockets.get(drawerId);
  const currentWord = words[Math.floor(Math.random() * words.length)];

  gameState.set(roomId, {
    currentWord,
    drawerId,
    drawingTime: 30,
    guessingTime: 60,
    phase: "drawing",
  });

  // Anunță desenatorul
  drawerSocket.emit("setPhase", {
    phase: "drawing",
    word: currentWord,
  });

  // Anunță restul că începe faza de desen
  io.to(roomId).emit("setPhase", {
    phase: "drawing",
    drawer: drawerSocket.username,
  });

  // Timer pentru desen și ghicit
  let timer = setInterval(() => {
    const state = gameState.get(roomId);
    if (!state) {
      clearInterval(timer);
      return;
    }

    if (state.phase === "drawing") {
      state.drawingTime--;
      io.to(roomId).emit("timeUpdate", {
        time: state.drawingTime,
        phase: "drawing",
      });
      if (state.drawingTime <= 0) {
        state.phase = "guessing";
        io.to(roomId).emit("setPhase", {
          phase: "guessing",
          hint: "_ ".repeat(state.currentWord.length),
        });
      }
    } else {
      state.guessingTime--;
      io.to(roomId).emit("timeUpdate", {
        time: state.guessingTime,
        phase: "guessing",
      });
      if (state.guessingTime <= 0) {
        clearInterval(timer);
        endRound(roomId);
      }
    }
  }, 1000);
}

function endRound(roomId) {
  const state = gameState.get(roomId);
  if (!state) return;

  io.to(roomId).emit("roundEnded", {
    word: state.currentWord,
    drawer: io.sockets.sockets.get(state.drawerId)?.username,
  });

  // Runda următoare după 5s
  setTimeout(() => startRound(roomId), 5000);
}

server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});
