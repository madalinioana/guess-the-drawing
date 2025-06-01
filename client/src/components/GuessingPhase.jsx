import React, { useState } from "react";

export default function GuessingPhase({ drawer, hint, timeLeft, onGuess }) {
  const [guess, setGuess] = useState("");

  const send = () => {
    if (!guess.trim()) return;
    onGuess(guess);
    setGuess("");
  };

  return (
    <div className="guessing-phase-container">
      <p className="guessing-text">
        Guess <strong>{drawer}</strong>'s drawing
      </p>
      <div className="guessing-input-group">
        <input
          value={guess}
          onChange={e => setGuess(e.target.value)}
          onKeyPress={e => e.key === "Enter" && send()}
          placeholder="Answer..."
          className="guessing-input"
        />
        <button onClick={send} className="guessing-button">Send</button>
      </div>
      <p className="guessing-hint">
        Hint: <span className="guessing-hint-value">{hint}</span>
      </p>
      <p className="guessing-timer">⏳ Time left: {timeLeft}s</p>
    </div>
  );
}
