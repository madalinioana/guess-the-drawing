const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const leaderboardService = {
  async getLeaderboard(sortBy = "totalScore", limit = 50) {
    try {
      const response = await fetch(
        `${API_URL}/leaderboard?sortBy=${sortBy}&limit=${limit}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch leaderboard");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async getUserStats(username) {
    try {
      const response = await fetch(`${API_URL}/leaderboard/user/${username}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch user stats");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },
};
