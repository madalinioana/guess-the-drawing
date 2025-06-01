import React, { useState } from "react";
import "./Chat.css";

export default function Chat({ messages, onSendMessage, isDrawer }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  return (
  <div className="chat">
    <div className="chat-header">
      <h4>Chat</h4>
      <div className="chat-divider"></div>
    </div>

    <div className="messages">
      {messages.map((m, i) => (
        <div key={i} className="msg">
          <strong>{m.username}:</strong> {m.message}
        </div>
      ))}
    </div>

    {!isDrawer && (
      <div className="input-row">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyPress={e => e.key === "Enter" && send()}
          placeholder="Scrie un mesaj."
        />
        <button onClick={send}>Trimite</button>
      </div>
    )}

    {isDrawer && (
      <p className="drawer-note">
        (Nu poți ghici în timp ce desenezi)
      </p>
    )}
  </div>
);

}
