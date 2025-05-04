// GameRoom.jsx
import React from "react";
import Header from "./Header";
import Chat from "./Chat";
import DrawingBoard from "./DrawingBoard";
import WinnerDisplay from "./WinnerDisplay";
import Leaderboard from "./Leaderboard";

export default function GameRoom(props) {
  const { socket, roomId, isCreator, users, game, messages, onStartGame, onSendMessage, username, scores} = props;
  const isDrawer = game.drawer === username;

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
        isDrawer={isDrawer}    // <-- nou
      />
      <Leaderboard scores={scores} />

      {game.lastWinner && <WinnerDisplay winner={game.lastWinner} />}
    </div>
  );
}
