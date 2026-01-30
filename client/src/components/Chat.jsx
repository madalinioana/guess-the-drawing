import React, { useState } from "react";
import "./Chat.css";

export default function Chat({ messages, onSendMessage, isDrawer }) {
  const [text, setText] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);

  const send = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  return (
    <div className={`chat ${isMinimized ? "minimized" : ""}`}>
      <div className="chat-header">
        <h4>Chat</h4>
        <div className="chat-divider"></div>
        <button
          className="minimize-btn"
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Expand" : "Minimize"}
        >
          {isMinimized ? "▲" : "▼"}
        </button>
      </div>

      {!isMinimized && (
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className="msg">
              <strong>{m.username}:</strong> {m.message}
            </div>
          ))}
        </div>
      )}

      {!isDrawer && (
        <div className="input-row">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyPress={e => e.key === "Enter" && send()}
            placeholder="Type a message..."
          />
          <button onClick={send}>Send</button>
        </div>
      )}

      {isDrawer && !isMinimized && (
        <p className="drawer-note">
          (You can't guess while drawing)
        </p>
      )}
    </div>
  );
}
