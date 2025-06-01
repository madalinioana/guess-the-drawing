# 🎮 Guess the Drawing

A real-time multiplayer drawing game inspired by [Skribbl.io](https://skribbl.io). One player draws a hidden word while the others try to guess it through chat before time runs out.

## 🛠️ Technologies Used

### Frontend (`client/`)

- React 19
- Vite
- Socket.IO Client
- React-Konva (drawing canvas)

### Backend (`server/`)

- Node.js
- Express
- Socket.IO

---

## 🚀 Features

- Create or join a game room
- Automatic drawer selection at the start of each round
- Real-time synchronized drawing canvas
- Guessing via live chat
- Dynamic scoring system and leaderboard
- Only the room creator can start the game
- Kick players from the room
- WhatsApp invitation with auto-generated room link

---

## 🧪 Automated Testing

- Unit tests for key components: `Chat`, `Header`, `Leaderboard`, `Lobby`
- Configured using **Jest** and **React Testing Library**

```bash
# from the client/ folder
npm install
npm test
```

## ⚙️ How to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/madalinioana/guess-the-drawing
   cd guess-the-drawing
   ```
2. Install dependencies:
   
   Backend:
   ```bash
   cd server
   npm install
   ```
   Frontend:
   ```bash
   cd ../client
   npm install
   ```
4. Run the app:
   
   Server:
   ```bash 
   node server.js
   ```
   Client:
   ```bash
   npm run dev
   ```
5. Open your browser at http://localhost:5173

   ## 1. User Stories

### Backend
1. **Enter App:**  
   As a user, I want to choose a unique nickname to join the game so that I can participate in drawing and guessing.

2. **Room Management:**  
   As a user, I want to create a new room or join an existing one (by room code) so that I can play with friends or random opponents.

3. **Word Assignment:**  
   As a user, I want the server to assign a random word to the current drawer each round so that the game proceeds automatically.

4. **Real-Time Drawing Broadcast:**  
   As a user, I want my drawing strokes to be sent to the server and broadcast to all connected clients in the room so that everyone sees the same sketch in real time.

5. **Chat & Guessing:**  
   As a user, I want to send chat messages or guess attempts; the server should check guesses against the assigned word and award points when correct.

6. **Scoring & Ranking:**  
   As a user, I want the server to track all players’ points and update the room leaderboard so that I can see who’s winning each round.

### Frontend
7. **Drawing Tools:**  
   As a user, I want an intuitive set of drawing tools (brush size, colors, eraser) so that I can sketch clearly.

8. **Live Canvas Rendering:**  
   As a user, I want the canvas to update immediately as others draw so that I can guess in real time without delay.

9. **Responsive Design:**  
   As a user, I want the app to adapt to different screen sizes so that I can play on desktop or mobile seamlessly.

10. **Clean Interface:**  
    As a user, I want a minimal, intuitive UI with clear indicators (whose turn it is, timer countdown, current score) so that I can focus on drawing and guessing.
## 2. Backlog Creation

1. **Enter App:**  
   - [x] Choose nickname  
   - [x] Validate nickname uniqueness  
   - [ ] Persist nickname between sessions  

2. **Room Management:**  
   - [x] Create new room with unique code  
   - [x] Join room by code  
   - [ ] Show room list/lobby  
   - [ ] Invite friends via shareable link  

3. **Word Assignment:**  
   - [x] Maintain word bank on server  
   - [x] Assign random word to drawer each round  
   - [ ] Allow custom word lists  

4. **Real-Time Drawing Broadcast:**  
   - [x] Set up Socket.io connection  
   - [x] Emit drawing events (stroke start/end, coordinates)  
   - [x] Broadcast strokes to all clients in room  
   - [ ] Optimize for high-latency environments  

5. **Chat & Guessing:**  
   - [x] Open text-input chat component  
   - [x] Compare guesses to target word  
   - [x] Broadcast “correct guess” event  
   - [ ] Prevent repeated guesses of the same word  

6. **Scoring & Ranking:**  
   - [x] Maintain per-player score on server  
   - [x] Emit score updates after each correct guess  
   - [ ] Display historical round winners  
   - [ ] Persist overall statistics (games played, win rate)  

7. **Drawing Tools (Frontend):**  
   - [x] Brush size selection  
   - [x] Color palette  
   - [x] Eraser tool  
   - [ ] Undo/redo functionality  

8. **Live Canvas Rendering (Frontend):**  
   - [x] Render strokes in real time as they arrive  
   - [x] Clear canvas at round start/end  
   - [ ] Show a “preview” layer for pending strokes  

9. **Responsive Design (Frontend):**  
   - [x] Use flexible CSS grid for layout  
   - [x] Test on mobile and desktop viewports  
   - [ ] Refine touch controls on mobile  

10. **Clean Interface (Frontend):**  
    - [x] Display current drawer and timer  
    - [x] Show player list with avatars and scores  
    - [ ] Add animations for turn transitions  

## 3. UML Diagram

![UML_diagram](images/umDiagrama.png)

Below is a concise, plain-language overview of the UML diagram shown above:

1. **Overall Layout**  
   - The diagram is split into two halves: **Backend (left)** and **Frontend (right)**.  
   - Both halves live inside a single bounding box labeled with their technology stacks (Node/Express/Socket.io on the left; React/Vite/Socket.io Client on the right).

2. **Backend Section**  
   - **GameServer** sits at the top: it listens on a network port, handles incoming Socket.io connections, and exposes methods such as `start(port)`, `createRoom(roomId, host)`, `joinRoom(roomId, player)`, `leaveRoom(roomId, player)`, and `broadcastToRoom(roomId, event, data)`.  
   - **GameRoom** is the core “room” object:  
     - **Attributes:**  
       - `roomId` (unique primary key)  
       - `players: List<Player>` (all participants)  
       - `drawer: Player` (the player currently drawing)  
       - `currentWord: String` (word to be drawn)  
       - `roundInProgress: boolean` (tracks if a round is active)  
       - `timer: Timer` (manages the countdown)  
     - **Methods:**  
       - `addPlayer(p: Player)` / `removePlayer(p: Player)`  
       - `startRound()` / `endRound()` / `nextDrawer()`  
       - `receiveDrawing(data: DrawingData)` (processes pencil strokes)  
       - `receiveGuess(player: Player, guess: String)` (checks chat guesses)  
       - `calculateScores()`  
     - Represents a single game room: it holds state for players, the current drawer, the current word, and round timing.  
   - **Player** represents one connected user:  
     - **Attributes:**  
       - `socketId: String` (primary key)  
       - `username: String`  
       - `score: int`  
       - `isHost: boolean` (true if this player created the room)  
       - `roomId: String` (foreign key to GameRoom)  
     - **Methods:**  
       - `send(event: String, data: Object)` (emit a socket event)  
       - `updateScore(points: int)` (adjust the player’s score)  
   - **ChatMessage** models each text message sent in a room:  
     - **Attributes:**  
       - `messageId: String` (primary key)  
       - `roomId: String` (foreign key)  
       - `senderId: String` (foreign key to Player)  
       - `text: String`  
       - `timestamp: Date`  
     - Represents a single chat entry.  
   - **DrawingData** encapsulates every drawing stroke:  
     - **Attributes:**  
       - `drawingId: String` (primary key)  
       - `roomId: String` (foreign key)  
       - `playerId: String` (foreign key to Player)  
       - `x: float` / `y: float` (coordinates)  
       - `color: String`  
       - `thickness: int`  
       - `tool: String` (e.g., “brush” or “eraser”)  
     - When the drawer moves their mouse, the client builds a DrawingData object and sends it to the server, which relays it to all other clients in that room.

3. **Frontend Section**  
   - **App** is the root React component:  
     - **Attributes:**  
       - `socket: SocketIOClient.Socket` (the active socket connection)  
       - `isConnected: boolean` (tracks connection status)  
       - `currentRoom: String` (the room code the user has joined)  
     - **Methods:**  
       - `render(): JSX.Element`  
       - `handleConnect(): void` / `handleDisconnect(): void`  
     - Initializes the Socket.io client and tracks global connection state.  
   - **Header** is a simple component displaying the game’s title.  
   - **Lobby** allows users to browse or create rooms:  
     - **Attributes:**  
       - `rooms: String[]` (list of active room codes)  
       - `username: String` (entered by the player)  
     - **Methods:**  
       - `fetchRooms(): void` (retrieve available rooms)  
       - `handleJoin(roomId: String): void` (join an existing room)  
       - `handleCreate(roomName: String): void` (create a new room)  
       - `render(): JSX.Element`  
   - **Room** represents the main game view after joining:  
     - **Attributes:**  
       - `roomId: String`  
       - `players: PlayerClient[]` (client-side player models)  
       - `drawerId: String` (which player is currently drawing)  
       - `currentWord: String` (hidden from guessers)  
       - `timeLeft: number` (remaining seconds in the current round)  
     - **Methods:**  
       - `componentDidMount(): void` (register socket listeners)  
       - `sendChat(text: String): void` (emit a chat/guess event)  
       - `sendDrawing(data: DrawingData): void` (emit stroke data)  
       - `render(): JSX.Element`  
     - Displays chat, drawing canvas, player list (leaderboard), and timer.  
   - **Chat** displays a scrolling list of `ChatMessageClient[]` objects, each with `sender`, `text`, and `timestamp`.  
   - **DrawingCanvas** is the interactive drawing area:  
     - **Attributes:**  
       - `isDrawer: boolean` (true if this client is the current drawer)  
       - `color: String` / `thickness: number` (brush settings)  
     - **Methods:**  
       - `onMouseDown(e: MouseEvent): void` / `onMouseMove(e: MouseEvent): void` / `onMouseUp(e: MouseEvent): void` (gather and emit DrawingData)  
       - `clearCanvas(): void` (reset the canvas at round start/end)  
       - `render(): JSX.Element`  
   - **Leaderboard** shows a list of `PlayerClient[]`, each with `id`, `username`, and `score`, highlighting the drawer.  
   - **Timer** displays the countdown (`timeLeft: number`) and has methods `startCountdown(duration: number)` and `stopCountdown()`.  
   - **PlayerClient** (client-side model):  
     - `id: String`  
     - `username: String`  
     - `score: number`  
   - **ChatMessageClient** (client-side model):  
     - `sender: String`  
     - `text: String`  
     - `timestamp: String`

4. **Key Relationships & Data Flow**  
   1. **Server → Room Management**  
      - Clients emit `createRoom` or `joinRoom` to **GameServer**, which creates/returns a **GameRoom**.  
      - **GameRoom** holds its `players`, the current `drawer`, and a **Timer**.  
      - When a round starts, **GameRoom** selects a `currentWord`, sets `roundInProgress = true`, and starts the **Timer**.

   2. **Drawing Broadcast**  
      - The drawer’s client calls `onMouseMove` in **DrawingCanvas**, emitting `drawing` events matching **DrawingData** to **GameServer**.  
      - **GameServer** calls `broadcastToRoom(roomId, 'drawing', data)`. Each client’s **DrawingCanvas** receives that data and renders the stroke immediately.

   3. **Chat & Guess Processing**  
      - All clients send chat messages via `sendChat(text)` in **Room**, emitting a `guessAttempt` event to **GameServer**.  
      - **GameServer** runs `receiveGuess(player, guess)`. If correct, it updates that **Player**’s score and broadcasts a “correct guess” event.  
      - The **Leaderboard** updates by broadcasting an updated `players` list to all clients.

   4. **Round Transition**  
      - When the **Timer** in **GameRoom** expires or everyone guesses correctly, **GameRoom** calls `endRound()`, updates scores, picks a new drawer with `nextDrawer()`, chooses a new `currentWord`, and resets the **Timer**.  
      - Clients receive a `newRound` event, which triggers **DrawingCanvas.clearCanvas()**, **Timer.startCountdown()**, and updates the drawer highlight in **Leaderboard**.

   5. **Client State Models**  
      - **PlayerClient** and **ChatMessageClient** mirror server-side **Player** and **ChatMessage** but use client-friendly types (e.g., timestamp as a string).  
      - **DrawingData** on the client matches exactly what the server expects for real-time stroke broadcasting.


## 6. Unit Test Automation

**Status:** In progress  

Tests are written using [Jasmine](https://jasmine.github.io/) (frontend) and [Mocha & Chai](https://mochajs.org/ + https://www.chaijs.com/) (backend).

- **Backend Tests (Mocha & Chai):**  
  - `RoomService`  
    - `createRoom()`  
    - `joinRoom()`  
    - `assignWord()`  
  - `ScoreService`  
    - `calculatePoints()`  
    - `updateLeaderboard()`  
  - `WordBank`  
    - `getRandomWord()`  
    - `validateCustomWordList()`  

- **Frontend Tests (Jasmine):**  
  - `DrawingComponent`  
    - should emit stroke data on draw  
    - should clear canvas at round end  
  - `ChatComponent`  
    - should send chat message on Enter  
    - should not allow empty guesses  
  - `LobbyComponent`  
    - should create a new room via API  
    - should navigate to room on successful join  

_Test results snapshot:_  
![Unit_Tests_Results](readme_images/unitTest.png)
![Unit_Tests_Results](readme_images/unitTestServer.png)

### How to Run Tests

#### Backend
```bash
cd server
npm install
npm test
```
### Client
```bash
cd client
npm install
npm test
```

## 9. Design Patterns

### [Socket.io Pub/Sub Pattern](https://socket.io/docs/v4/pub-sub/)  

#### Directory Structure
```plaintext
Backend/
├─ controllers/
│  ├─ roomController.js
│  ├─ gameController.js
│  └─ chatController.js
├─ services/
│  ├─ RoomService.js
│  ├─ GameService.js
│  └─ ScoreService.js
├─ models/
│  ├─ Room.js
│  ├─ Player.js
│  └─ GameRound.js
├─ utils/
│  └─ WordBank.js
├─ sockets/
│  └─ socketHandlers.js
├─ routes.js
└─ server.js

Frontend/
├─ src/
│  ├─ app/
│  │  ├─ drawing/
│  │  ├─ chat/
│  │  ├─ lobby/
│  │  ├─ leaderboard/
│  │  └─ services/
│  │     ├─ socket.service.ts
│  │     └─ api.service.ts
│  ├─ assets/
│  └─ index.html
└─ angular.json
```



