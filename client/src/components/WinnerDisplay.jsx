import React from "react";

export default function WinnerDisplay({ winner }) {
  return (
    <div style={styles.box}>
      🎉 {winner}
    </div>
  );
}

const styles = {
  box: {
    background: "#E8F5E9",
    padding: 15,
    borderRadius: 8,
    borderLeft: "4px solid #4CAF50",
    marginTop: 20
  }
};
