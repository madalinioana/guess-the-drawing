import React, { useState } from "react";
import "./ProfileModal.css";

const AVATARS = [
  "😀", "😎", "🤓", "😇", "🤠", "🥳", "🤖", "👾",
  "🐶", "🐱", "🐼", "🐨", "🦊", "🦁", "🐯", "🐸",
  "🎨", "🎮", "🎯", "🎲", "🎭", "🎪", "🎸", "🎹"
];

export default function ProfileModal({ isOpen, onClose, user, onUpdateProfile }) {
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "😀");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({ avatar: selectedAvatar });
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "profile-modal-overlay") {
      onClose();
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={handleOverlayClick}>
      <div className="profile-modal-container">
        <button className="profile-modal-close" onClick={onClose}>×</button>
        
        <h2 className="profile-modal-title">Your Profile</h2>

        <div className="profile-info-section">
          <div className="profile-current-avatar">
            <span className="profile-avatar-large">{selectedAvatar}</span>
          </div>
          
          <div className="profile-details">
            <div className="profile-detail-row">
              <span className="profile-label">Username:</span>
              <span className="profile-value">{user.username}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-label">Email:</span>
              <span className="profile-value">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3 className="profile-section-title">Choose Your Avatar</h3>
          <div className="profile-avatar-grid">
            {AVATARS.map((avatar) => (
              <button
                key={avatar}
                className={`profile-avatar-option ${selectedAvatar === avatar ? "selected" : ""}`}
                onClick={() => setSelectedAvatar(avatar)}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        <div className="profile-actions">
          <button 
            className="profile-save-button" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <button className="profile-cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
