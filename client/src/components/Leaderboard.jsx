import React from "react";
import "./Leaderboard.css";

export default function Leaderboard({ scores }) {
  const sorted = [...scores].sort((a, b) => b[1] - a[1]);

  return (
    <div className="leaderboard-box">
      <h3 className="leaderboard-title">🏆 Clasament</h3>
      <ul className="leaderboard-list">
        {sorted.map(([user, score], i) => (
          <li key={user} className="leaderboard-item">
            {i + 1}. {user}: {score}p
          </li>
        ))}
      </ul>
    </div>
  );
}
