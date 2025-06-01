import React, { useEffect } from "react";
import Header from "./Header";
import Chat from "./Chat";
import DrawingBoard from "./DrawingBoard";
import WinnerDisplay from "./WinnerDisplay";
import Leaderboard from "./Leaderboard";
import { toast } from "react-toastify";
import "./GameRoom.css";

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
    scores,
    onLeaveRoom
  } = props;

  const isDrawer = game.drawer === username;

  useEffect(() => {
    if (!socket) return;

    const handleKicked = () => {
      toast.error("You have been kicked from the room!");
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    };

    socket.on("kicked", handleKicked);
    return () => socket.off("kicked", handleKicked);
  }, [socket]);

  const getSocketId = (name) => {
    const userObj = users.find((u) => u.name === name);
    return userObj?.id;
  };

  const handleKick = (targetName) => {
    const targetId = getSocketId(targetName);
    toast(`${targetName} has been kicked`);
    console.log("Kick →", targetName, targetId);
    if (targetId) {
      socket.emit("kick-player", { targetId, roomId });
    }
  };

  return (
    <div className="game-container">
      <Header
        roomId={roomId}
        isCreator={isCreator}
        users={users}
        game={game}
        onStartGame={onStartGame}
        onLeaveRoom={onLeaveRoom}
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
        <div className="kick-panel">
          <h3 className="kick-title">Manage Players</h3>
          {users
            .filter((user) => user.name !== username)
            .map((user) => (
              <div className="kick-row" key={user.id}>
                <span className="kick-name">{user.name}</span>
                <button className="kick-button" onClick={() => handleKick(user.name)}>
                  Kick
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
