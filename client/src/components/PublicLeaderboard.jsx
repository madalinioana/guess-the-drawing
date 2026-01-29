import React, { useState, useEffect } from "react";
import { leaderboardService } from "../services/leaderboardService";
import "./PublicLeaderboard.css";

export default function PublicLeaderboard({ onBack }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("totalScore");

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leaderboardService.getLeaderboard(sortBy, 50);
      setLeaderboard(data.leaderboard);
    } catch (err) {
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const sortOptions = [
    { value: "totalScore", label: "Total Score" },
    { value: "gamesWon", label: "Games Won" },
    { value: "gamesPlayed", label: "Games Played" },
    { value: "correctGuesses", label: "Correct Guesses" },
  ];

  return (
    <div className="public-leaderboard-container">
      <div className="public-leaderboard-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1 className="public-leaderboard-title">🏆 Global Leaderboard</h1>
      </div>

      <div className="sort-controls">
        <span className="sort-label">Sort by:</span>
        <div className="sort-buttons">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              className={`sort-button ${sortBy === option.value ? "active" : ""}`}
              onClick={() => setSortBy(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p className="error-message">❌ {error}</p>
          <button className="retry-button" onClick={fetchLeaderboard}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <div className="empty-container">
          <p className="empty-message">No players yet! Be the first to play!</p>
        </div>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="rank-col">Rank</th>
                <th className="player-col">Player</th>
                <th className="stat-col">Score</th>
                <th className="stat-col">Games</th>
                <th className="stat-col">Won</th>
                <th className="stat-col">Win %</th>
                <th className="stat-col">Guesses</th>
                <th className="stat-col">Drawings</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player) => (
                <tr
                  key={player.username}
                  className={`leaderboard-row ${player.rank <= 3 ? "top-three" : ""}`}
                >
                  <td className="rank-col">
                    {getMedalEmoji(player.rank) || `#${player.rank}`}
                  </td>
                  <td className="player-col">
                    <span className="player-avatar">{player.avatar}</span>
                    <span className="player-name">{player.username}</span>
                  </td>
                  <td className="stat-col score-col">{player.stats.totalScore}</td>
                  <td className="stat-col">{player.stats.gamesPlayed}</td>
                  <td className="stat-col">{player.stats.gamesWon}</td>
                  <td className="stat-col">{player.stats.winRate}%</td>
                  <td className="stat-col">{player.stats.correctGuesses}</td>
                  <td className="stat-col">{player.stats.drawingsCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="leaderboard-footer">
        <p>Play games to climb the rankings!</p>
      </div>
    </div>
  );
}
