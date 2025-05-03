import React from "react";
import Header from "./Header";
import Chat from "./Chat";
import GuessingPhase from "./GuessingPhase";
import WinnerDisplay from "./WinnerDisplay";
import DrawingBoard from "./DrawingBoard";

export default function GameRoom({
  socket,
  roomId,
  isCreator,
  users,
  game,
  messages,
  onStartGame,
  onSendMessage,
  onGuess,
  username
}) {
  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <Header
        roomId={roomId}
        isCreator={isCreator}
        users={users}
        game={game}
        onStartGame={onStartGame}
      />

      {game.phase === "drawing" && (
        <DrawingBoard
                socket={socket}
                isDrawer={game.drawer === username}
                gamePhase={game.phase}
                currentWord={game.currentWord}
                />
      )}

      {game.phase === "guessing" && game.drawer !== username && (
        <GuessingPhase
          drawer={game.drawer}
          hint={game.hint}
          timeLeft={game.timeLeft}
          onGuess={onGuess}
        />
      )}

      <Chat messages={messages} onSendMessage={onSendMessage} />

      {game.lastWinner && <WinnerDisplay winner={game.lastWinner} />}
    </div>
  );
}
