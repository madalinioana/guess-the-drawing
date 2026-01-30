const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const friendsService = {
  async getFriends(userId) {
    try {
      const response = await fetch(`${API_URL}/friends/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get friends");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async getFriendRequests(userId) {
    try {
      const response = await fetch(`${API_URL}/friends/${userId}/requests`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get friend requests");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async sendFriendRequest(userId, targetUsername) {
    try {
      const response = await fetch(`${API_URL}/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, targetUsername }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send friend request");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async acceptFriendRequest(userId, fromUserId) {
    try {
      const response = await fetch(`${API_URL}/friends/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, fromUserId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to accept friend request");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async rejectFriendRequest(userId, fromUserId) {
    try {
      const response = await fetch(`${API_URL}/friends/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, fromUserId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reject friend request");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async cancelFriendRequest(userId, toUserId) {
    try {
      const response = await fetch(`${API_URL}/friends/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, toUserId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel friend request");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async removeFriend(userId, friendId) {
    try {
      const response = await fetch(`${API_URL}/friends/${userId}/${friendId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove friend");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async searchUsers(query, excludeUserId) {
    try {
      const response = await fetch(
        `${API_URL}/friends/search/${encodeURIComponent(query)}?excludeUserId=${excludeUserId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to search users");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },
};
