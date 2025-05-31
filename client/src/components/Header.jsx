// Header.jsx
import React from "react";

export default function Header({ roomId, isCreator, users, game, onStartGame, onLeaveRoom}) {
  const phaseLabel = game.phase === "drawing" || game.phase === "select-word"
    ? "🎨 Desenare"
    : game.phase === "waiting"
      ? "⌛ Așteptare"
      : "🔍 Ghicit";

  return (
    <div style={styles.header}>
      <h3>
        Camera: {roomId}
        {isCreator && <span style={styles.badge}>Creator</span>}
      </h3>
      <p>Jucători: {users.map(u => u.name).join(", ")}</p>
      <p>{phaseLabel} | Timp: {game.timeLeft}s</p>
      {isCreator && game.phase === "waiting" && (
        <button onClick={onStartGame} style={styles.startBtn}>
          Start Joc
        </button>
      )}
      <button onClick={onLeaveRoom} style={styles.exitBtn}>
        Părăsește camera
      </button>

      <a
      href={`https://wa.me/?text=${encodeURIComponent(
        `Join my Scribble game! ${window.location.origin}/room/${roomId}`
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ marginLeft: isCreator ? 10 : 0 }}
    >
      <button style={styles.inviteBtn}>Invită pe WhatsApp</button>
    </a>
    </div>
  );
}

const styles = {
  header: { background: "#f5f5f5", padding: 15, borderRadius: 8, marginBottom: 20 },
  badge: { background: "#FF9800", color: "#fff", padding: "3px 8px", borderRadius: 10, marginLeft: 10 },
  startBtn: { marginTop: 10, padding: "8px 16px", background: "#9C27B0", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" },
  inviteBtn: { padding: "8px 16px", background: "#25D366", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer"},
  exitBtn: {marginLeft: "10px", cursor: "pointer", marginTop: 20, background: "#f44336", color: "#fff", padding: "10px 16px", border: "none", borderRadius: 5 }
};
