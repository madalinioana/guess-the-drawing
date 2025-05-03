import React from "react";

export default function Header({ roomId, isCreator, users, game, onStartGame }) {
  return (
    <div style={styles.header}>
      <h3>
        Camera: {roomId}
        {isCreator && <span style={styles.badge}>Creator</span>}
      </h3>
      <p>👥 Jucători: {users.join(", ")}</p>
      <p>
        {game.phase === "drawing" ? "🎨 Desenare" : "🔍 Ghicit"} | Timp: {game.timeLeft}s
      </p>
      {isCreator && game.phase === "waiting" && (
        <button onClick={onStartGame} style={styles.startBtn}>
          Start Joc
        </button>
      )}
    </div>
  );
}

const styles = {
  header: { background: "#f5f5f5", padding: 15, borderRadius: 8, marginBottom: 20 },
  badge: { background: "#FF9800", color: "#fff", padding: "3px 8px", borderRadius: 10, marginLeft: 10 },
  startBtn: { marginTop: 10, padding: "8px 16px", background: "#9C27B0", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }
};
