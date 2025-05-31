import React, { useEffect, useState } from "react";
import socket from "./socket";
import Lobby from "./components/Lobby";
import GameRoom from "./components/GameRoom";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

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

  // Funcția de leave room
  const handleLeaveRoom = () => {
    socket.emit("leave-room");
    setRoomId("");
    setIsCreator(false);
    setMessages([]);
    setScores([]);
    setUsersInRoom([]);
    setGame({
      phase: "waiting",
      timeLeft: 0,
      currentWord: "",
      drawer: "",
      lastWinner: ""
    });
    toast.info("Ai părăsit camera.");
  };

  useEffect(() => {
    const handleRoomCreated = (newRoomId) => {
      setRoomId(newRoomId);
      setIsCreator(true);
    };

    const handleRoomJoined = ({ roomId, users }) => {
      setRoomId(roomId);
      setUsersInRoom(users);
    };

    const handleUpdateUsers = (users) => setUsersInRoom(users);

    const handleUpdateScores = (updatedScores) => {
      setScores(updatedScores);
    };

    const handleMessage = (data) =>
      setMessages(prev => [...prev, data]);

    const handleSetPhase = (data) =>
      setGame(prev => ({
        ...prev,
        phase: data.phase,
        currentWord: data.word || "",
        drawer: data.drawer || "",
        timeLeft: data.time != null ? data.time : prev.timeLeft
      }));

    const handleTimeUpdate = ({ time }) =>
      setGame(prev => ({ ...prev, timeLeft: time }));

    const handleCorrectGuess = ({ username, word }) => {
      setMessages(prev => [
        ...prev,
        { username: "System", message: `${username} a ghicit "${word}"!` }
      ]);
      setGame(prev => ({ ...prev, lastWinner: `${username} a ghicit "${word}"` }));
    };

    const handleRoundEnded = ({ drawer, word }) => {
      setGame(prev => ({
        ...prev,
        phase: "waiting",
        currentWord: "",
        drawer: "",
        timeLeft: 0,
        lastWinner: `${drawer} a desenat “${word}”`
      }));
    };

    const handlePlayerKicked = () => {
      toast.error("Ai fost dat afară din cameră.");
      handleLeaveRoom(); // efectuează și reset local
    };

    const handleCreatorChanged = (newCreatorSocketId) => {
       if (socket.username === username) {
          setIsCreator(true);
          toast.info("Ai devenit noul creator.");
        } else {
          setIsCreator(false);
        }
    };

    socket.on("roomCreated", handleRoomCreated);
    socket.on("roomJoined", handleRoomJoined);
    socket.on("updateUsers", handleUpdateUsers);
    socket.on("updateScores", handleUpdateScores);
    socket.on("message", handleMessage);
    socket.on("setPhase", handleSetPhase);
    socket.on("timeUpdate", handleTimeUpdate);
    socket.on("correctGuess", handleCorrectGuess);
    socket.on("roundEnded", handleRoundEnded);
    socket.on("kicked", handlePlayerKicked);
    socket.on("creator-changed", handleCreatorChanged);
    socket.on("players-update", handleUpdateUsers);
    socket.on("error", (msg) => toast.error(msg));

    return () => {
      socket.off("roomCreated", handleRoomCreated);
      socket.off("roomJoined", handleRoomJoined);
      socket.off("updateUsers", handleUpdateUsers);
      socket.off("updateScores", handleUpdateScores);
      socket.off("message", handleMessage);
      socket.off("setPhase", handleSetPhase);
      socket.off("timeUpdate", handleTimeUpdate);
      socket.off("correctGuess", handleCorrectGuess);
      socket.off("roundEnded", handleRoundEnded);
      socket.off("kicked", handlePlayerKicked);
      socket.off("creator-changed", handleCreatorChanged);
      socket.off("players-update", handleUpdateUsers);
      socket.off("error");
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
    if (usersInRoom.length < 2) {
      toast.warn("Ai nevoie de cel puțin 2 jucători pentru a porni jocul.");
      return;
    }
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
          onLeaveRoom={handleLeaveRoom}
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
