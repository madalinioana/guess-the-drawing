import React, { useState, useEffect } from "react";
import { friendsService } from "../services/friendsService";
import "./FriendsPanel.css";

export default function FriendsPanel({
  user,
  socket,
  roomId,
  onShowAddFriend,
  onShowFriendRequests,
  pendingRequestsCount
}) {
  const [friends, setFriends] = useState([]);
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [inviteSent, setInviteSent] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchFriends();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!socket || friends.length === 0) return;

    const friendIds = friends.map(f => f.userId);
    socket.emit("get-friends-online", friendIds);

    const handleOnlineStatus = (statuses) => {
      setOnlineStatuses(statuses);
    };

    socket.on("friends-online-status", handleOnlineStatus);

    const interval = setInterval(() => {
      socket.emit("get-friends-online", friendIds);
    }, 30000);

    return () => {
      socket.off("friends-online-status", handleOnlineStatus);
      clearInterval(interval);
    };
  }, [socket, friends]);

  useEffect(() => {
    if (!socket) return;

    const handleInviteSent = ({ targetUserId }) => {
      setInviteSent(prev => ({ ...prev, [targetUserId]: true }));
      setTimeout(() => {
        setInviteSent(prev => ({ ...prev, [targetUserId]: false }));
      }, 3000);
    };

    const handleInviteError = ({ message }) => {
      console.error("Invite error:", message);
    };

    socket.on("invite-sent", handleInviteSent);
    socket.on("invite-error", handleInviteError);

    return () => {
      socket.off("invite-sent", handleInviteSent);
      socket.off("invite-error", handleInviteError);
    };
  }, [socket]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const data = await friendsService.getFriends(user.id);
      setFriends(data.friends || []);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = (friendUserId) => {
    if (!socket || !roomId) return;

    socket.emit("invite-to-room", {
      targetUserId: friendUserId,
      roomId
    });
  };

  if (!user) {
    return (
      <div className={`friends-panel floating ${isMinimized ? "minimized" : ""}`}>
        <div className="friends-panel-header">
          <h3>Friends</h3>
          <div className="friends-header-buttons">
            <button
              className="friends-header-btn minimize-btn"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? "▲" : "▼"}
            </button>
          </div>
        </div>
        {!isMinimized && (
          <div className="friends-login-prompt">
            <p>Login to see your friends and invite them to play!</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`friends-panel floating ${isMinimized ? "minimized" : ""}`}>
      <div className="friends-panel-header">
        <h3>Friends</h3>
        <div className="friends-header-buttons">
          <button
            className="friends-header-btn requests-btn"
            onClick={onShowFriendRequests}
            title="Friend Requests"
          >
            📬
            {pendingRequestsCount > 0 && (
              <span className="requests-badge">{pendingRequestsCount}</span>
            )}
          </button>
          <button
            className="friends-header-btn add-btn"
            onClick={onShowAddFriend}
            title="Add Friend"
          >
            +
          </button>
          <button
            className="friends-header-btn minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {loading ? (
            <div className="friends-loading">Loading...</div>
          ) : friends.length === 0 ? (
            <div className="friends-empty">
              <p>No friends yet!</p>
              <button className="add-friend-btn" onClick={onShowAddFriend}>
                Add Friends
              </button>
            </div>
          ) : (
            <ul className="friends-list">
              {friends.map((friend) => (
                <li key={friend.userId} className="friend-item">
                  <div className="friend-info">
                    <span className="friend-avatar">{friend.avatar}</span>
                    <span className="friend-name">{friend.username}</span>
                    <span
                      className={`friend-status ${
                        onlineStatuses[friend.userId] ? "online" : "offline"
                      }`}
                    >
                      {onlineStatuses[friend.userId] ? "●" : "○"}
                    </span>
                  </div>
                  {roomId && (
                    <button
                      className={`invite-btn ${inviteSent[friend.userId] ? "sent" : ""}`}
                      onClick={() => handleInvite(friend.userId)}
                      disabled={inviteSent[friend.userId] || !onlineStatuses[friend.userId]}
                      title={
                        !onlineStatuses[friend.userId]
                          ? "Friend is offline"
                          : inviteSent[friend.userId]
                          ? "Invite sent!"
                          : "Invite to room"
                      }
                    >
                      {inviteSent[friend.userId] ? "✓" : "Invite"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <button className="refresh-btn" onClick={fetchFriends} title="Refresh friends list">
            🔄
          </button>
        </>
      )}
    </div>
  );
}
