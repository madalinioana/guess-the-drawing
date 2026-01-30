import React from "react";

export default function Lobby({
  username,
  setUsername,
  inputRoomId,
  setInputRoomId,
  onCreateRoom,
  onJoinRoom,
  onShowLeaderboard,
  user
}) {
  return (
    <div className="lobby-container">
      <h1 className="lobby-title">Guess the Drawing v2.0 🚀</h1>

      <input
        className="lobby-input"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        disabled={!!user}
      />

      <button onClick={onCreateRoom} className="lobby-button green">
        Create Room
      </button>

      <p className="lobby-or">or</p>

      <input
        className="lobby-input"
        placeholder="Room ID"
        value={inputRoomId}
        onChange={e => setInputRoomId(e.target.value)}
      />

      <button onClick={onJoinRoom} className="lobby-button blue">
        Join
      </button>

      <div className="lobby-divider"></div>

      <button onClick={onShowLeaderboard} className="lobby-button yellow">
        🏆 Leaderboard
      </button>

      {!user && (
        <p className="lobby-guest-note">
          Playing as guest. Login to save your stats!
        </p>
      )}
    </div>
  );
}
