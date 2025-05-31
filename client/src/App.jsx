// App.jsx
import React, { useEffect, useState } from "react";
import socket from "./socket";
import Lobby from "./components/Lobby";
import GameRoom from "./components/GameRoom";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [inputRoomId, setInputRoomId] = useState("");
  const [messages, setMessages] = useState([]);
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [game, setGame] = useState({
    phase: "waiting",
    timeLeft: 0,
    currentWord: "",
    drawer: "",
    lastWinner: ""
  });
  const [scores, setScores] = useState([]);


  useEffect(() => {
    socket.on("roomCreated", newRoomId => {
      setRoomId(newRoomId);
      setIsCreator(true);
    });

    socket.on("roomJoined", ({ roomId, users }) => {
      setRoomId(roomId);
      setUsersInRoom(users);
    });
    socket.on("updateScores", updatedScores => {
      setScores(updatedScores); // [["Andrei", 10], ["Maria", 5]]
    });

    socket.on("updateUsers", users => setUsersInRoom(users));

    socket.on("message", data =>
      setMessages(prev => [...prev, data])
    );

    socket.on("setPhase", data =>
      setGame(prev => ({
        ...prev,
        phase: data.phase,
        currentWord: data.word || "",
        drawer: data.drawer || "",
        timeLeft: data.time != null ? data.time : prev.timeLeft
      }))
    );

    socket.on("timeUpdate", ({ time }) =>
      setGame(prev => ({ ...prev, timeLeft: time }))
    );

    socket.on("correctGuess", ({ username, word }) => {
      setMessages(prev => [
        ...prev,
        { username: "System", message: `${username} a ghicit "${word}"!` }
      ]);
      setGame(prev => ({ ...prev, lastWinner: `${username} a ghicit "${word}"` }));
    });

    socket.on("roundEnded", ({ drawer, word }) => {
      setGame(prev => ({
        ...prev,
        phase: "waiting",
        currentWord: "",
        drawer: "",
        timeLeft: 0,
        lastWinner: `${drawer} a desenat “${word}”`
      }));
    });
    socket.on("players-update", (players) => {
      setUsersInRoom(players); // players este [{ id, name }]
    });
    return () => {
      socket.on("error", msg => alert(msg));
      socket.off("players-update");
      };
    
  }, []);

  const handleCreateRoom = () => {
    if (username.trim()) socket.emit("createRoom", username);
  };
  const handleJoinRoom = () => {
    if (username.trim() && inputRoomId.trim())
      socket.emit("joinRoom", { roomId: inputRoomId, username });
  };
  const handleStartGame = () => {
    if (roomId) socket.emit("startGame", roomId);
  };
  const handleSendMessage = msg => {
    if (msg.trim() && roomId) {
      socket.emit("message", msg);
    }
  };
return (
  <>
    {!roomId ? (
      <Lobby
        username={username}
        setUsername={setUsername}
        inputRoomId={inputRoomId}
        setInputRoomId={setInputRoomId}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    ) : (
      <GameRoom
        socket={socket}
        roomId={roomId}
        isCreator={isCreator}
        users={usersInRoom}
        game={game}
        messages={messages}
        onStartGame={handleStartGame}
        onSendMessage={handleSendMessage}
        username={username}
        scores={scores}
      />
    )}
    <ToastContainer
  position="top-center"
  autoClose={4000}
  hideProgressBar={false}
  newestOnTop
  pauseOnFocusLoss
  draggable
/>
  </>
  );
}

export default App;
