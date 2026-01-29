import React from "react";
import "./Leaderboard.css";

export default function Leaderboard({ scores, users }) {
  const sorted = [...scores].sort((a, b) => b[1] - a[1]);

  const getUserAvatar = (username) => {
    const user = users?.find(u => u.name === username);
    return user?.avatar || '👤';
  };

  return (
    <div className="leaderboard-box">
      <h3 className="leaderboard-title">🏆 Leaderboard</h3>
      <ul className="leaderboard-list">
        {sorted.map(([user, score], i) => (
          <li key={user} className="leaderboard-item">
            <span className="leaderboard-rank">{i + 1}.</span>
            <span className="leaderboard-avatar">{getUserAvatar(user)}</span>
            <span className="leaderboard-name">{user}:</span>
            <span className="leaderboard-score">{score} pts</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
