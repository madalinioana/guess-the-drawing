import React, { useEffect, useRef, useState } from "react";
import socket from "./socket";
import Lobby from "./components/Lobby";
import GameRoom from "./components/GameRoom";
import AuthModal from "./components/AuthModal";
import AuthButton from "./components/AuthButton";
import ProfileModal from "./components/ProfileModal";
import PublicLeaderboard from "./components/PublicLeaderboard";
import { ToastContainer, toast } from "react-toastify";
import { authService } from "./services/authService";
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
    wordHint: "",
    wordLength: 0,
    drawer: "",
    lastWinner: ""
  });
  const [scores, setScores] = useState([]);
  
  // Authentication state
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // View state for navigation
  const [currentView, setCurrentView] = useState("lobby"); // "lobby" or "leaderboard"

  const socketIdRef = useRef("");

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Pre-fill username if user is logged in
        if (parsedUser.username) {
          setUsername(parsedUser.username);
        }
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

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
        currentWord: data.word || prev.currentWord || "",
        wordHint: data.wordHint || "",
        wordLength: data.wordLength || 0,
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
        wordHint: "",
        wordLength: 0,
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
    socket.on("rateLimited", (msg) =>
      toast.warning(
        <div className="custom-toast-warning">{msg || "Slow down! Too many messages."}</div>
      )
    );
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
      socket.off("rateLimited");
      socket.off("error");
    };
  }, []);

  const handleCreateRoom = () => {
    if (username.trim()) {
      socket.emit("createRoom", {
        username,
        userId: user?.id || null,
        avatar: user?.avatar || "👤"
      });
    }
  };

  const handleJoinRoom = () => {
    if (username.trim() && inputRoomId.trim()) {
      socket.emit("joinRoom", {
        roomId: inputRoomId,
        username,
        userId: user?.id || null,
        avatar: user?.avatar || "👤"
      });
    }
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

  // Authentication handlers
  const handleLogin = async (credentials) => {
    try {
      const data = await authService.login(credentials.username, credentials.password);
      const userData = {
        id: data.userId,
        username: data.username,
        email: data.email,
        avatar: data.avatar || "😀",
        token: data.token
      };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setUsername(data.username);
      setShowAuthModal(false);
      toast.success(
        <div className="custom-toast-success">
          ✅ Welcome back, <strong>{data.username}</strong>!
        </div>
      );
    } catch (error) {
      toast.error(
        <div className="custom-toast-error">
          ❌ {error.message || "Login failed"}
        </div>
      );
    }
  };

  const handleRegister = async (credentials) => {
    try {
      const data = await authService.register(
        credentials.username,
        credentials.email,
        credentials.password
      );
      const userData = {
        id: data.userId,
        username: data.username,
        email: data.email,
        avatar: data.avatar || "😀",
        token: data.token
      };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setUsername(data.username);
      setShowAuthModal(false);
      toast.success(
        <div className="custom-toast-success">
          🎉 Welcome, <strong>{data.username}</strong>! Account created successfully.
        </div>
      );
    } catch (error) {
      toast.error(
        <div className="custom-toast-error">
          ❌ {error.message || "Registration failed"}
        </div>
      );
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setUsername("");
    
    // If in a room, leave it
    if (roomId) {
      handleLeaveRoom();
    }
    
    toast.info(
      <div className="custom-toast-info">
        👋 You have been logged out.
      </div>
    );
  };

  const handleLoginClick = () => {
    setShowAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  const handleUpdateProfile = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      await authService.updateProfile(user.id, updates);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success(
        <div className="custom-toast-success">
          ✅ Profile updated successfully!
        </div>
      );
    } catch (error) {
      toast.error(
        <div className="custom-toast-error">
          ❌ {error.message || "Failed to update profile"}
        </div>
      );
      throw error;
    }
  };

  // Render based on current view
  const renderContent = () => {
    // If in a game room, always show the game
    if (roomId) {
      return (
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
      );
    }

    // Otherwise, show based on currentView
    switch (currentView) {
      case "leaderboard":
        return <PublicLeaderboard onBack={() => setCurrentView("lobby")} />;
      default:
        return (
          <Lobby
            username={username}
            setUsername={setUsername}
            inputRoomId={inputRoomId}
            setInputRoomId={setInputRoomId}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onShowLeaderboard={() => setCurrentView("leaderboard")}
            user={user}
          />
        );
    }
  };

  return (
    <>
      {/* Auth buttons - fixed position at top right, only visible in lobby */}
      {!roomId && currentView === "lobby" && (
        <div className="auth-fixed-container">
          <AuthButton
            user={user}
            onLoginClick={handleLoginClick}
            onLogout={handleLogout}
            onProfileClick={handleProfileClick}
          />
        </div>
      )}

      {renderContent()}

      <AuthModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={handleCloseProfileModal}
        user={user}
        onUpdateProfile={handleUpdateProfile}
      />

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
