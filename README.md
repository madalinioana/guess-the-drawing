# Guess the Drawing

[![CI Pipeline](https://github.com/madalinioana/guess-the-drawing/actions/workflows/ci.yml/badge.svg)](https://github.com/madalinioana/guess-the-drawing/actions/workflows/ci.yml)

Un joc multiplayer in timp real unde un jucator deseneaza un cuvant, iar ceilalti incearca sa il ghiceasca prin chat inainte sa expire timpul.

[Joaca jocul](https://guess-the-drawing-tau.vercel.app/) | [Video demo](https://youtu.be/7kIcNPx2oTA)

---

## Tehnologii utilizate

### Frontend
- React 19
- Vite
- Socket.IO Client
- React-Konva (rendering canvas)

### Backend
- Node.js
- Express
- Socket.IO

### Deployment
- Frontend: Vercel (CDN)
- Backend: Railway (Container)

---

## Functionalitati

- Creare si acces camere multiplayer
- Canvas de desenat sincronizat in timp real
- Sistem de ghicire bazat pe chat
- Scor dinamic bazat pe viteza de ghicire
- Clasament live cu ranking jucatori
- Controale host (kick jucatori, start joc)
- Partajare camera prin WhatsApp
- Timer 60 secunde per runda

---

## Instalare si configurare locala

### Cerinte preliminare
- Node.js 18 sau mai nou
- npm sau yarn

### Pasi de instalare

1. Clonare repository:
   ```bash
   git clone https://github.com/madalinioana/guess-the-drawing
   cd guess-the-drawing
   ```

2. Instalare dependinte backend:
   ```bash
   cd server
   npm install
   ```

3. Instalare dependinte frontend:
   ```bash
   cd ../client
   npm install
   ```

4. Pornire server backend:
   ```bash
   cd server
   node server.js
   ```
   Server ruleaza pe `http://localhost:3001`

5. Pornire server development frontend:
   ```bash
   cd client
   npm run dev
   ```
   Aplicatie disponibila la `http://localhost:5173`

---

## Prezentare generala arhitectura

### Design sistem

Aplicatia urmeaza o arhitectura Client-Server cu comunicare event-driven:

- **Frontend (React SPA):** Gestioneaza rendering UI, input utilizator si desenare canvas
- **Backend (Node.js):** Administreaza starea jocului, logica camerelor si comunicare WebSocket
- **Real-time Layer (Socket.IO):** Permite comunicare bidirectionala bazata pe evenimente

### Componente cheie

**Backend:**
- `GameServer` - Gestioneaza conexiuni Socket.IO si routing
- `RoomManager` - Operatii CRUD pentru camere joc
- `GameLogic` - Management runde, scoring si validare cuvinte
- `PlayerManager` - Tracking stare jucatori

**Frontend:**
- `App` - Componenta root si routing
- `Lobby` - Interfata creare si join camere
- `Room` - Container principal joc
- `DrawingCanvas` - Interfata desenare bazata pe Konva
- `Chat` - Afisare mesaje si input ghicire
- `Leaderboard` - Ranking scoruri jucatori
- `Timer` - Afisare countdown runda

### Flow date

1. **Creare camera:** Client emit `createRoom` -> Server genereaza ID unic -> Broadcast catre client
2. **Sincronizare desenare:** Drawer emit evenimente `drawing` -> Server valideaza si broadcast in camera
3. **Procesare ghicire:** Jucator emit `guess` -> Server valideaza cu cuvantul curent -> Update scoruri daca corect
4. **Management runda:** Timer expira sau ghicire corecta -> Server trigger `endRound` -> Selecteaza drawer nou

Pentru documentatie arhitecturala detaliata, vezi [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Testare

### Teste unitare

Testele sunt implementate folosind Jest (frontend) si Mocha + Chai (backend).

**Teste backend:**
- RoomManager: `createRoom()`, `addPlayer()`, `removePlayer()`
- GameLogic: `checkGuess()`, `calculateScore()`, `startRound()`
- Input Validation: `sanitizeInput()`, `sanitizeUsername()`

**Teste frontend:**
- DrawingCanvas: emitere strokes, clear canvas, validare drawer
- Chat: trimitere mesaje, sanitizare input, preventie ghiciri goale
- Lobby: creare camere, navigare, error handling
- Leaderboard: sortare scoruri, highlight drawer

### Rulare teste

Backend:
```bash
cd server
npm test
```

Frontend:
```bash
cd client
npm test
```

Coverage teste: ~70% (unit tests), ~50% (integration tests)

### Rezultate teste

Rezultate teste backend:
```
RoomManager Service
  ✓ should create a new room
  ✓ should generate unique room IDs
  ✓ should add player to existing room
  ✓ should reject if room is full

GameLogic Service
  ✓ should return true for correct guess
  ✓ should be case insensitive
  ✓ should calculate score correctly

12 passing (45ms)
```

Rezultate teste frontend:
```
PASS  src/components/__tests__/Chat.test.jsx
PASS  src/components/__tests__/Leaderboard.test.jsx
PASS  src/components/__tests__/DrawingCanvas.test.jsx

Test Suites: 4 passed, 4 total
Tests: 18 passed, 18 total
Time: 3.241 s
```

---

## Structura proiect

```plaintext
guess-the-drawing/
├── client/                 # Aplicatie React frontend
│   ├── src/
│   │   ├── components/    # Componente React
│   │   ├── services/      # Serviciu Socket.IO client
│   │   └── App.jsx        # Componenta root
│   ├── tests/             # Teste unitare Jest
│   └── package.json
│
├── server/                # Aplicatie Node.js backend
│   ├── services/
│   │   ├── RoomManager.js
│   │   ├── GameLogic.js
│   │   └── PlayerManager.js
│   ├── utils/
│   │   └── sanitize.js
│   ├── tests/             # Teste unitare Mocha
│   ├── server.js          # Entry point
│   └── package.json
│
└── docs/                  # Documentatie proiect
    ├── ARCHITECTURE.md
    ├── TESTING_PLAN.md
    ├── SECURITY_ANALYSIS.md
    ├── CICD.md
    └── diagrams/
```

---

## Design patterns

### Pub/Sub Pattern (Socket.IO)

Aplicatia implementeaza pattern-ul Publish/Subscribe prin Socket.IO pentru comunicare event-based in timp real:

- **Publishers:** Clientii emit evenimente (drawing, guess, createRoom)
- **Subscribers:** Server-ul si ceilalti clienti asculta evenimente specifice
- **Rooms:** Grupari logice care izoleaza broadcasting-ul evenimentelor

Exemplu:
```javascript
// Publisher (client)
socket.emit('drawing', {roomId, x, y, color});

// Subscriber (server)
socket.on('drawing', (data) => {
  socket.to(data.roomId).emit('drawingReceived', data);
});
```

### Observer Pattern

Componentele observa schimbarile de stare ale jocului prin event listeners Socket.IO:

```javascript
// Componenta Chat observa mesaje noi
socket.on('newMessage', (message) => {
  setMessages(prev => [...prev, message]);
});

// Leaderboard observa update-uri scoruri
socket.on('scoresUpdated', (players) => {
  setPlayers(players.sort((a, b) => b.score - a.score));
});
```

---

## Masuri de securitate

### Validare input

Toate input-urile utilizatorilor sunt sanitizate server-side:

```javascript
function sanitizeInput(text) {
  return text
    .trim()
    .substring(0, 100)
    .replace(/<[^>]*>/g, '')         // Eliminare tag-uri HTML
    .replace(/javascript:/gi, '')    // Eliminare protocol JS
    .replace(/on\w+=/gi, '');       // Eliminare event handlers
}
```

### Verificari autorizare

Server-ul valideaza permisiunile inainte de a procesa actiuni:

```javascript
// Doar drawer-ul poate emite evenimente drawing
socket.on('drawing', (data) => {
  if (socket.id !== room.drawerId) {
    return; // Ignora silent
  }
  // Proceseaza desenare
});

// Doar host-ul poate kick jucatori
socket.on('kickPlayer', (data) => {
  if (socket.id !== room.hostId) {
    socket.emit('error', {code: 'UNAUTHORIZED'});
    return;
  }
  // Proceseaza kick
});
```

### Rate limiting

Evenimentele sunt rate-limited pentru a preveni spam:

- Evenimente drawing: max 60/secunda
- Evenimente guess: max 5 per 2 secunde
- Creare camere: max 3 per minut

Pentru analiza detaliata de securitate, vezi [docs/SECURITY_ANALYSIS.md](docs/SECURITY_ANALYSIS.md)

---

## Pipeline CI/CD

### Integrare continua

Workflow GitHub Actions ruleaza la fiecare push:
- Teste unitare backend (Mocha + Chai)
- Teste unitare frontend (Jest + RTL)
- Verificari calitate cod ESLint
- Verificare build

### Deployment continuu

- **Frontend:** Deployment automat pe Vercel la push pe branch main
- **Backend:** Deployment automat pe Railway la push pe branch main
- **Preview:** Deployment-uri preview pentru pull requests

Timp deployment: ~2-3 minute pentru ambele servicii

Pentru documentatie detaliata CI/CD, vezi [docs/CICD.md](docs/CICD.md)

---

## Dezvoltare asistata AI

Acest proiect a utilizat AI (ChatGPT) pentru decizii arhitecturale si ghidare implementare:

### Arii cheie de asistenta

1. **Design arhitectura:** Structura full-stack cu Socket.IO pentru comunicare real-time
2. **Logica joc:** Sistem bazat pe ture cu timer si rotatie automata drawer
3. **Sincronizare desenare:** Broadcasting canvas in timp real cu event throttling
4. **Edge cases:** Gestionare disconnect, ghiciri concurente, management stare camera
5. **Strategie deployment:** Backend pe Railway (suport WebSocket) vs limitari Vercel
6. **UI/UX:** Customizare brush, feedback vizual, design responsive

Istoric conversatie complet: [ChatGPT link](https://chatgpt.com/share/684f0a50-3e9c-8007-b4a5-e20547ab7b5d)

---

## Documentatie

Documentatia completa a proiectului este disponibila in directorul `docs/`:

- **[Documentatie arhitecturala](docs/ARCHITECTURE.md)** - Diagrame C4, decizii de design, cerinte non-functionale
- **[Plan de testare](docs/TESTING_PLAN.md)** - Strategii de testare, metodologii si rezultate
- **[Analiza securitate](docs/SECURITY_ANALYSIS.md)** - Evaluare riscuri si masuri de mitigare
- **[Pipeline CI/CD](docs/CICD.md)** - Procese deployment si configurari environment-uri