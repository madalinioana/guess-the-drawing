import React, { useState } from "react";

export default function GuessingPhase({ drawer, hint, timeLeft, onGuess }) {
  const [guess, setGuess] = useState("");

  const send = () => {
    onGuess(guess);
    setGuess("");
  };

  return (
    <div style={styles.container}>
      <p>Ghicește desenul lui <strong>{drawer}</strong></p>
      <input
        value={guess}
        onChange={e => setGuess(e.target.value)}
        onKeyPress={e => e.key === "Enter" && send()}
        placeholder="Răspuns..."
        style={styles.input}
      />
      <button onClick={send} style={styles.btn}>Trimite</button>
      <p>Indiciu: <span style={{ letterSpacing: 3 }}>{hint}</span></p>
      <p>Timp rămas: {timeLeft}s</p>
    </div>
  );
}

const styles = {
  container: { background: "#fff", padding: 20, borderRadius: 8, marginBottom: 20 },
  input: { padding: 10, flex: 1, marginRight: 10, borderRadius: 5, border: "1px solid #ddd" },
  btn: { padding: "10px 20px", background: "#4CAF50", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }
};
