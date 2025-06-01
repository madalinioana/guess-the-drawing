import React from "react";
import "./Header.css";

export default function Header({ roomId, isCreator, users, game, onStartGame, onLeaveRoom }) {
  const phaseLabel =
    game.phase === "drawing" || game.phase === "select-word"
      ? "🎨 Drawing"
      : game.phase === "waiting"
      ? "⌛ Waiting"
      : "🔍 Guessing";

  return (
    <div className="header-container">
      <h3 className="header-title">
        Room: {roomId}
        {isCreator && <span className="creator-badge">Creator</span>}
      </h3>

      <p className="header-info">Players: {users.map(u => u.name).join(", ")}</p>
      <p className="header-info">{phaseLabel} | Time: {game.timeLeft}s</p>

      <div className="header-buttons">
        {isCreator && game.phase === "waiting" && (
          <button onClick={onStartGame} className="start-button">
            Start Game
          </button>
        )}

        <button onClick={onLeaveRoom} className="exit-button">
          Leave Room
        </button>

        <a
        href={`https://wa.me/?text=${encodeURIComponent(
          `Join my Scribble game! ${window.location.origin}/?room=${roomId}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <button className="whatsapp-button">Invite on WhatsApp</button>
      </a>

      </div>
    </div>
  );
}
