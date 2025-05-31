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
3.Run the app:
  Server:
  ```bash 
  node server.js
  ```
  Client:
  ```bash
  npm run dev
  ```
4.Open your browser at http://localhost:5173
   


