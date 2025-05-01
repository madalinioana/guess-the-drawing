const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const gameState = new Map(); // { roomId: { currentWord, drawerId, roundTime } }
const words = ["mar", "copac", "masina", "pisica", "telefon"];

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map(); // Format: { roomId: Set<socket.id> }

// Generează un ID de cameră unic (4 cifre)
const generateRoomId = () => {
  let roomId;
  do {
    roomId = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(roomId)); // Evită duplicatele
  return roomId;
};

io.on("connection", (socket) => {
  console.log("✅ Utilizator conectat:", socket.id);

  // Creare cameră nouă
  socket.on("createRoom", (username) => {
    const roomId = generateRoomId();
    rooms.set(roomId, new Set([socket.id])); // Adaugă camera cu creatorul
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;
    socket.emit("roomCreated", roomId); // Trimite ID-ul camerei înapoi la client
  });

  // Alăturare la cameră existentă
  // Evenimentul "joinRoom" actualizat
  socket.on("joinRoom", ({ roomId, username }) => {
    if (!rooms.has(roomId)) {
      socket.emit("error", "Camera nu există!");
      return;
    }
  
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;
    rooms.get(roomId).add(socket.id);
  
    // Obține lista curentă de jucători (fără duplicate)
    const users = Array.from(rooms.get(roomId)).map(id => {
      const s = io.sockets.sockets.get(id);
      return s?.username || "Guest";
    });
  
    // Trimite lista actualizată doar noului jucător (fără a notifica pe ceilalți încă)
    socket.emit("roomJoined", { 
      roomId,
      users // Lista curentă (inclusiv noul jucător)
    });
  
    // Anunță CAMERA (inclusiv noul jucător) despre lista actualizată
    io.to(roomId).emit("updateUsers", users);
  });
  socket.on("startGame", (roomId) => {
  if (rooms.has(roomId) && rooms.get(roomId).size >= 2) {
    startRound(roomId);
  }
});

  // Mesaje în cameră
  socket.on("message", (message) => {
    const roomId = socket.roomId;
    if (roomId) {
      io.to(roomId).emit("message", {
        username: socket.username,
        message,
      });
    }
  });
  

  // Deconectare
  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (roomId) {
    console.log("jucator deconectat" + socket.id);
      rooms.get(roomId)?.delete(socket.id);
      socket.to(roomId).emit("userLeft", socket.username);
      // Șterge camera dacă este goală
      if (rooms.get(roomId)?.size === 0) {
        rooms.delete(roomId);
      }
    }
  });
  // Gestionare ghicire corectă
socket.on("guess", (guess, callback) => {
   const roomId = socket.roomId;
  const state = gameState.get(roomId);
  
  if (!state || !callback) return; // Adăugați verificare callback
  
  if (guess.toLowerCase() === state.currentWord.toLowerCase()) {
    io.to(roomId).emit("correctGuess", {
      username: socket.username,
      word: state.currentWord
    });
    endRound(roomId);
    callback(true);
  } else {
    callback(false);
  }
});    
// Trimitere date desen către ceilalți din cameră
socket.on("draw", (data) => {
  const roomId = socket.roomId;
  if (roomId) {
    socket.to(roomId).emit("drawing", data); // Trimite la toți din cameră, mai puțin la cel care desenează
  }
});

socket.on('send-drawing', (data) => {
  socket.to(socket.roomId).broadcast.emit('receive-drawing', data);
});

socket.on('clear-board', () => {
  io.to(socket.roomId).emit('clear-board');
});
});

// Adaugă funcțiile noi la final (înainte de server.listen)
function startRound(roomId) {
  const players = Array.from(rooms.get(roomId));
  const drawerId = players[Math.floor(Math.random() * players.length)];
  const drawerSocket = io.sockets.sockets.get(drawerId);
  const currentWord = words[Math.floor(Math.random() * words.length)];

  gameState.set(roomId, {
    currentWord,
    drawerId,
    drawingTime: 30, // 30s pentru desen
    guessingTime: 60, // 60s pentru ghicit
    phase: 'drawing' // sau 'guessing'
  });

  // Anunță desenatorul
  drawerSocket.emit('setPhase', { 
    phase: 'drawing',
    word: currentWord 
  });

  // Anunță ceilalți că începe runda
  io.to(roomId).emit('setPhase', { 
    phase: 'drawing',
    drawer: drawerSocket.username 
  });

  // Timer desen
  const timer = setInterval(() => {
    const state = gameState.get(roomId);
    
    if (state.phase === 'drawing') {
      state.drawingTime--;
      io.to(roomId).emit('timeUpdate', { 
        time: state.drawingTime,
        phase: 'drawing' 
      });

      if (state.drawingTime <= 0) {
        state.phase = 'guessing';
        io.to(roomId).emit('setPhase', { 
          phase: 'guessing',
          hint: "_ ".repeat(state.currentWord.length) 
        });
      }
    } else {
      state.guessingTime--;
      io.to(roomId).emit('timeUpdate', {
        time: state.guessingTime,
        phase: 'guessing' 
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
    io.to(roomId).emit('roundEnded', {
      word: state.currentWord,
      drawer: io.sockets.sockets.get(state.drawerId)?.username
    });
    
    // Pornire rundă nouă după pauză
    setTimeout(() => startRound(roomId), 5000);
  }

server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});