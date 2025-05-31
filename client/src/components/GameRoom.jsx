import React, { useEffect } from "react";
import Header from "./Header";
import Chat from "./Chat";
import DrawingBoard from "./DrawingBoard";
import WinnerDisplay from "./WinnerDisplay";
import Leaderboard from "./Leaderboard";
import {toast} from 'react-toastify';
export default function GameRoom(props) {
  const {
    socket,
    roomId,
    isCreator,
    users,
    game,
    messages,
    onStartGame,
    onSendMessage,
    username,
    scores
  } = props;

  const isDrawer = game.drawer === username;

  // === Ascultă dacă ai fost dat afară ===
  useEffect(() => {
    if (!socket) return;

    const handleKicked = () => {
      
    toast.error("Ai fost dat afară din cameră!");
    setTimeout(() => {
      window.location.href = "/";
    }, 3000); // așteaptă 3 secunde pentru a vedea mesajul
  };

    socket.on("kicked", handleKicked);
    return () => socket.off("kicked", handleKicked);
  }, [socket]);

  // === Funcție pentru a obține socketId din username ===
  const getSocketId = (name) => {
    const userObj = users.find(u => u.name === name);
    return userObj?.id;
  };

  // === Buton de kick doar pentru host ===
  const handleKick = (targetName) => {
  const targetId = getSocketId(targetName);
    toast(`${targetName} a fost dat afară`);
    console.log("Kick →", targetName, targetId);
    if (targetId) {
      socket.emit("kick-player", { targetId, roomId });
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <Header
        roomId={roomId}
        isCreator={isCreator}
        users={users}
        game={game}
        onStartGame={onStartGame}
      />

      <DrawingBoard
        socket={socket}
        isDrawer={isDrawer}
        currentWord={game.currentWord}
        phase={game.phase}
      />

      <Chat
        messages={messages}
        onSendMessage={onSendMessage}
        isDrawer={isDrawer}
      />

      <Leaderboard scores={scores} />

      {game.lastWinner && <WinnerDisplay winner={game.lastWinner} />}

      {isCreator && (
        <div style={{ marginTop: 20 }}>
          <h3>Gestionează jucători</h3>
          {users
            .filter(user => user.name !== username)
            .map(user => (
              <div key={user.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span>{user.name}</span>
                <button onClick={() => handleKick(user.name)}>Kick</button>
              </div>
          ))}
        </div>
      )}
    </div>
  );
}
