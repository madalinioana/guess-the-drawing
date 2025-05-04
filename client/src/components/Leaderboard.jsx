import React from "react";

export default function Leaderboard({ scores }) {
  const sorted = [...scores].sort((a, b) => b[1] - a[1]);

  return (
    <div style={styles.box}>
      <h3>🏆 Clasament</h3>
      <ul>
        {sorted.map(([user, score], i) => (
          <li key={user}>
            {i + 1}. {user}: {score} puncte
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  box: { background: "#eee", padding: 10, borderRadius: 8, marginTop: 20 }
};
