import React from "react";

export default function Lobby({
  username,
  setUsername,
  inputRoomId,
  setInputRoomId,
  onCreateRoom,
  onJoinRoom
}) {
  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto" }}>
      <input
        placeholder="Nume de utilizator"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={styles.input}
      />

      <button onClick={onCreateRoom} style={{ ...styles.btn, background: "#4CAF50" }}>
        Creează cameră
      </button>

      <p style={{ textAlign: "center" }}>Sau</p>

      <input
        placeholder="ID Cameră"
        value={inputRoomId}
        onChange={e => setInputRoomId(e.target.value)}
        style={styles.input}
      />

      <button onClick={onJoinRoom} style={{ ...styles.btn, background: "#2196F3" }}>
        Alătură-te
      </button>
    </div>
  );
}

const styles = {
  input: { padding: 10, width: "100%", marginBottom: 10, borderRadius: 5, border: "1px solid #ddd" },
  btn: { padding: 10, width: "100%", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }
};
