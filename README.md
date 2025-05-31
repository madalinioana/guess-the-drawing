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
- Visual feedback for round winners

---

## 🧪 Automated Testing

- Unit tests for key components: `Chat`, `Header`, `Leaderboard`, `Lobby`
- Configured using **Jest** and **React Testing Library**

```bash
# from the client/ folder
npm install
npm test

