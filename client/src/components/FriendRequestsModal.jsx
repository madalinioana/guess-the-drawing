import React, { useState, useEffect } from "react";
import { friendsService } from "../services/friendsService";
import { toast } from "react-toastify";
import "./FriendRequestsModal.css";

export default function FriendRequestsModal({ isOpen, onClose, user, onRequestHandled }) {
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("received");
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchRequests();
    }
  }, [isOpen, user?.id]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await friendsService.getFriendRequests(user.id);
      setReceived(data.received || []);
      setSent(data.sent || []);
    } catch (error) {
      console.error("Failed to fetch friend requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (fromUserId, username) => {
    try {
      setProcessing(prev => ({ ...prev, [fromUserId]: true }));
      await friendsService.acceptFriendRequest(user.id, fromUserId);
      toast.success(
        <div className="custom-toast-success">
          You are now friends with <strong>{username}</strong>!
        </div>
      );
      setReceived(prev => prev.filter(r => r.userId !== fromUserId));
      onRequestHandled?.();
    } catch (error) {
      toast.error(
        <div className="custom-toast-error">
          {error.message || "Failed to accept request"}
        </div>
      );
    } finally {
      setProcessing(prev => ({ ...prev, [fromUserId]: false }));
    }
  };

  const handleReject = async (fromUserId) => {
    try {
      setProcessing(prev => ({ ...prev, [fromUserId]: true }));
      await friendsService.rejectFriendRequest(user.id, fromUserId);
      toast.info("Friend request rejected");
      setReceived(prev => prev.filter(r => r.userId !== fromUserId));
      onRequestHandled?.();
    } catch (error) {
      toast.error(
        <div className="custom-toast-error">
          {error.message || "Failed to reject request"}
        </div>
      );
    } finally {
      setProcessing(prev => ({ ...prev, [fromUserId]: false }));
    }
  };

  const handleCancel = async (toUserId) => {
    try {
      setProcessing(prev => ({ ...prev, [toUserId]: true }));
      await friendsService.cancelFriendRequest(user.id, toUserId);
      toast.info("Friend request cancelled");
      setSent(prev => prev.filter(r => r.userId !== toUserId));
    } catch (error) {
      toast.error(
        <div className="custom-toast-error">
          {error.message || "Failed to cancel request"}
        </div>
      );
    } finally {
      setProcessing(prev => ({ ...prev, [toUserId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="friend-requests-overlay" onClick={onClose}>
      <div className="friend-requests-container" onClick={(e) => e.stopPropagation()}>
        <button className="friend-requests-close" onClick={onClose}>
          &times;
        </button>

        <h2 className="friend-requests-title">Friend Requests</h2>

        <div className="friend-requests-tabs">
          <button
            className={`tab-btn ${activeTab === "received" ? "active" : ""}`}
            onClick={() => setActiveTab("received")}
          >
            Received ({received.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "sent" ? "active" : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            Sent ({sent.length})
          </button>
        </div>

        {loading ? (
          <div className="requests-loading">Loading...</div>
        ) : (
          <div className="requests-content">
            {activeTab === "received" && (
              <>
                {received.length === 0 ? (
                  <div className="requests-empty">No pending requests</div>
                ) : (
                  <ul className="requests-list">
                    {received.map((request) => (
                      <li key={request.userId} className="request-item">
                        <div className="request-info">
                          <span className="request-avatar">{request.avatar}</span>
                          <span className="request-name">{request.username}</span>
                        </div>
                        <div className="request-actions">
                          <button
                            className="accept-btn"
                            onClick={() => handleAccept(request.userId, request.username)}
                            disabled={processing[request.userId]}
                          >
                            {processing[request.userId] ? "..." : "Accept"}
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleReject(request.userId)}
                            disabled={processing[request.userId]}
                          >
                            {processing[request.userId] ? "..." : "Reject"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {activeTab === "sent" && (
              <>
                {sent.length === 0 ? (
                  <div className="requests-empty">No sent requests</div>
                ) : (
                  <ul className="requests-list">
                    {sent.map((request) => (
                      <li key={request.userId} className="request-item">
                        <div className="request-info">
                          <span className="request-avatar">{request.avatar}</span>
                          <span className="request-name">{request.username}</span>
                        </div>
                        <div className="request-actions">
                          <button
                            className="cancel-btn"
                            onClick={() => handleCancel(request.userId)}
                            disabled={processing[request.userId]}
                          >
                            {processing[request.userId] ? "..." : "Cancel"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
