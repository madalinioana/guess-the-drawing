import React, { useEffect, useRef, useState } from "react";
import socket from "./socket";
import Lobby from "./components/Lobby";
import GameRoom from "./components/GameRoom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ToastOverrides.css";
import "./App.css";

function App() {
  // state for username, room, messages, scores, etc.
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

  const socketIdRef = useRef("");

  useEffect(() => {
    // check for invite room in URL params
    const params = new URLSearchParams(window.location.search);
    const inviteRoom = params.get("room");
    if (inviteRoom) {
      setInputRoomId(inviteRoom);

      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleLeaveRoom = () => {
    // leave the room and reset state
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
    toast.info(
      <div className="custom-toast-info">
        You have left the room.
      </div>
    );
  };

  useEffect(() => {
    // setup socket listeners
    socketIdRef.current = socket.id;

    socket.on("connect", () => {
      socketIdRef.current = socket.id;
      console.log("Socket connected:", socket.id);
    });

    const handleRoomCreated = (newRoomId) => {
      setRoomId(newRoomId);
      setIsCreator(true);
    };

    const handleRoomJoined = ({ roomId, users }) => {
      setRoomId(roomId);
      setUsersInRoom(users);
    };

    const handleUpdateUsers = (users) => setUsersInRoom(users);
    const handleUpdateScores = (updatedScores) => setScores(updatedScores);

    const handleMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleSetPhase = (data) =>
      setGame((prev) => ({
        ...prev,
        phase: data.phase,
        currentWord: data.word || "",
        drawer: data.drawer || "",
        timeLeft: data.time != null ? data.time : prev.timeLeft
      }));

    const handleTimeUpdate = ({ time }) =>
      setGame((prev) => ({ ...prev, timeLeft: time }));

    const handleCorrectGuess = ({ username }) => {
      setMessages((prev) => [
        ...prev,
        { username: "System", message: `${username} guessed!` }
      ]);
      setGame((prev) => ({ ...prev, lastWinner: `${username} guessed` }));
      toast.success(
        <div className="custom-toast-success">
          🎉 <strong>{username}</strong> guessed correctly!
        </div>,
        {
          position: "top-center",
          autoClose: 4000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
    };

    const handleRoundEnded = ({ drawer, word }) => {
      setGame((prev) => ({
        ...prev,
        phase: "waiting",
        currentWord: "",
        drawer: "",
        timeLeft: 0,
        lastWinner: `${drawer} drew "${word}"`
      }));

      toast.info(
        <div className="custom-toast-info">
          🎉 <strong>{drawer}</strong> drew <em>"{word}"</em>
        </div>,
        {
          position: "top-center",
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
    };

    const handlePlayerKicked = () => {
      toast.error(
        <div className="custom-toast-error">
          ❌ You have been kicked from the room.
        </div>
      );
      handleLeaveRoom();
    };

    const handleCreatorChanged = ({ socketId, username: newCreatorName }) => {
      const isNewCreator = socketId === socketIdRef.current;
      setIsCreator(isNewCreator);
      if (isNewCreator) {
        toast.info(
          <div className="custom-toast-info">
            You are now the new creator.
          </div>
        );
      } else {
        toast(
          <div className="custom-toast-info">
            {newCreatorName} is now the creator.
          </div>
        );
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
    socket.on("error", (msg) =>
      toast.error(
        <div className="custom-toast-error">{msg}</div>
      )
    );

    return () => {
      // cleanup listeners on component unmount
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
      toast.warn(
        <div className="custom-toast-warn">
          ⚠️ You need at least <strong>2 players</strong> to start the game.
        </div>
      );
      return;
    }
    if (roomId) socket.emit("startGame", roomId);
  };

  const handleSendMessage = (msg) => {
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
