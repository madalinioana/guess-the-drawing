import React from "react";
import "./Header.css";

export default function Header({ roomId, isCreator, users, game, onStartGame, onLeaveRoom }) {
  const phaseLabel =
    game.phase === "drawing" || game.phase === "select-word"
      ? "🎨 Desenare"
      : game.phase === "waiting"
      ? "⌛ Așteptare"
      : "🔍 Ghicit";

  return (
    <div className="header-container">
      <h3 className="header-title">
        Camera: {roomId}
        {isCreator && <span className="creator-badge">Creator</span>}
      </h3>

      <p className="header-info">Jucători: {users.map(u => u.name).join(", ")}</p>
      <p className="header-info">{phaseLabel} | Timp: {game.timeLeft}s</p>

      <div className="header-buttons">
        {isCreator && game.phase === "waiting" && (
          <button onClick={onStartGame} className="start-button">
            Start Joc
          </button>
        )}

        <button onClick={onLeaveRoom} className="exit-button">
          Părăsește camera
        </button>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `Join my Scribble game! ${window.location.origin}/room/${roomId}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
        >
          <button className="whatsapp-button">Invită pe WhatsApp</button>
        </a>
      </div>
    </div>
  );
}
