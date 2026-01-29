import React from "react";
import "./AuthButton.css";

export default function AuthButton({ user, onLoginClick, onLogout, onProfileClick }) {
  if (user) {
    return (
      <div className="auth-button-container">
        <button onClick={onProfileClick} className="auth-user-info">
          <span className="auth-user-badge">{user.avatar || "👤"}</span>
          <span className="auth-username">{user.username}</span>
        </button>
        <button onClick={onLogout} className="auth-logout-button">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="auth-button-container">
      <button onClick={onLoginClick} className="auth-login-button">
        Login / Register
      </button>
    </div>
  );
}
