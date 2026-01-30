import React, { useState } from "react";
import { friendsService } from "../services/friendsService";
import { toast } from "react-toastify";
import "./AddFriendModal.css";

export default function AddFriendModal({ isOpen, onClose, user, onFriendRequestSent }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (query) => {
    setUsername(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const data = await friendsService.searchUsers(query, user.id);
      setSearchResults(data.users || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetUsername) => {
    if (!targetUsername.trim()) return;

    try {
      setLoading(true);
      await friendsService.sendFriendRequest(user.id, targetUsername);
      toast.success(
        <div className="custom-toast-success">
          Friend request sent to <strong>{targetUsername}</strong>!
        </div>
      );
      setUsername("");
      setSearchResults([]);
      onFriendRequestSent?.();
    } catch (error) {
      toast.error(
        <div className="custom-toast-error">
          {error.message || "Failed to send friend request"}
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendRequest(username);
  };

  return (
    <div className="add-friend-overlay" onClick={onClose}>
      <div className="add-friend-container" onClick={(e) => e.stopPropagation()}>
        <button className="add-friend-close" onClick={onClose}>
          &times;
        </button>

        <h2 className="add-friend-title">Add Friend</h2>

        <form onSubmit={handleSubmit} className="add-friend-form">
          <div className="add-friend-input-group">
            <input
              type="text"
              className="add-friend-input"
              placeholder="Enter username..."
              value={username}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="add-friend-submit"
              disabled={loading || !username.trim()}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </form>

        {searching && <div className="search-loading">Searching...</div>}

        {searchResults.length > 0 && (
          <div className="search-results">
            <h4>Search Results</h4>
            <ul className="search-results-list">
              {searchResults.map((result) => (
                <li key={result.userId} className="search-result-item">
                  <div className="search-result-info">
                    <span className="search-result-avatar">{result.avatar}</span>
                    <span className="search-result-name">{result.username}</span>
                  </div>
                  <button
                    className="search-result-add"
                    onClick={() => handleSendRequest(result.username)}
                    disabled={loading}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {username.length >= 2 && !searching && searchResults.length === 0 && (
          <div className="no-results">No users found</div>
        )}
      </div>
    </div>
  );
}
