const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Get public leaderboard
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const sortBy = req.query.sortBy || "totalScore";

    // Validate sortBy field
    const validSortFields = ["totalScore", "gamesWon", "gamesPlayed", "correctGuesses"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "totalScore";

    const leaderboard = await User.find({})
      .select("username avatar stats createdAt")
      .sort({ [`stats.${sortField}`]: -1 })
      .limit(limit)
      .lean();

    // Format response
    const formattedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      avatar: user.avatar,
      stats: {
        totalScore: user.stats.totalScore,
        gamesPlayed: user.stats.gamesPlayed,
        gamesWon: user.stats.gamesWon,
        correctGuesses: user.stats.correctGuesses,
        drawingsCompleted: user.stats.drawingsCompleted,
        avgScore: user.stats.gamesPlayed > 0
          ? Math.round(user.stats.totalScore / user.stats.gamesPlayed)
          : 0,
        winRate: user.stats.gamesPlayed > 0
          ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100)
          : 0,
      },
      joinedAt: user.createdAt,
    }));

    res.json({
      leaderboard: formattedLeaderboard,
      total: leaderboard.length,
      sortedBy: sortField,
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

// Get user stats by username
router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username })
      .select("username avatar stats createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's rank
    const higherScoreCount = await User.countDocuments({
      "stats.totalScore": { $gt: user.stats.totalScore },
    });

    res.json({
      username: user.username,
      avatar: user.avatar,
      rank: higherScoreCount + 1,
      stats: {
        totalScore: user.stats.totalScore,
        gamesPlayed: user.stats.gamesPlayed,
        gamesWon: user.stats.gamesWon,
        correctGuesses: user.stats.correctGuesses,
        drawingsCompleted: user.stats.drawingsCompleted,
        avgScore: user.stats.gamesPlayed > 0
          ? Math.round(user.stats.totalScore / user.stats.gamesPlayed)
          : 0,
        winRate: user.stats.gamesPlayed > 0
          ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100)
          : 0,
      },
      joinedAt: user.createdAt,
    });
  } catch (error) {
    console.error("User stats fetch error:", error);
    res.status(500).json({ message: "Failed to fetch user stats" });
  }
});

module.exports = router;
