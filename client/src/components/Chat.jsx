// Chat.jsx
import React, { useState } from "react";

export default function Chat({ messages, onSendMessage, isDrawer }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  return (
    <div style={styles.chat}>
      <h4>Chat</h4>
      <div style={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} style={styles.msg}>
            <strong>{m.username}:</strong> {m.message}
          </div>
        ))}
      </div>

      {/* Dacă e drawer, nu afișăm input-ul */}
      {!isDrawer && (
        <div style={styles.inputRow}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyPress={e => e.key === "Enter" && send()}
            placeholder="Scrie un mesaj."
            style={styles.input}
          />
          <button onClick={send} style={styles.btn}>Trimite</button>
        </div>
      )}
      {isDrawer && (
        <p style={{ fontStyle: "italic", color: "#888" }}>
          (Nu poți ghici în timp ce desenezi)
        </p>
      )}
    </div>
  );
}

const styles = {
  chat: { marginTop: 20, background: "#fff", padding: 20, borderRadius: 8 },
  messages: { maxHeight: 200, overflowY: "auto", marginBottom: 10 },
  msg: { marginBottom: 8, borderBottom: "1px dashed #eee", paddingBottom: 5 },
  inputRow: { display: "flex", gap: 10 },
  input: { flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ddd" },
  btn: { padding: "10px 20px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }
};
