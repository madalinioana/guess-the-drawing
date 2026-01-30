const express = require("express");
const User = require("../models/User");
const { sanitizeUsername } = require("../utils/sanitize");

const router = express.Router();

// Search users by username (for adding friends) - MUST be before /:userId routes
router.get("/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const { excludeUserId } = req.query;

    const cleanQuery = sanitizeUsername(query);
    if (!cleanQuery || cleanQuery.length < 2) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      username: { $regex: cleanQuery, $options: "i" },
      _id: { $ne: excludeUserId }
    })
      .select("username avatar")
      .limit(10)
      .lean();

    res.json({
      users: users.map(u => ({
        userId: u._id,
        username: u.username,
        avatar: u.avatar
      }))
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
});

// Get friends list
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("friends", "username avatar stats.totalScore")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const friends = user.friends.map(friend => ({
      userId: friend._id,
      username: friend.username,
      avatar: friend.avatar,
      totalScore: friend.stats?.totalScore || 0
    }));

    res.json({ friends });
  } catch (error) {
    console.error("Get friends error:", error);
    res.status(500).json({ message: "Failed to get friends list" });
  }
});

// Get friend requests (sent and received)
router.get("/:userId/requests", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("friendRequests.sent.to", "username avatar")
      .populate("friendRequests.received.from", "username avatar")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const sent = (user.friendRequests?.sent || []).map(req => ({
      userId: req.to._id,
      username: req.to.username,
      avatar: req.to.avatar,
      sentAt: req.sentAt
    }));

    const received = (user.friendRequests?.received || []).map(req => ({
      userId: req.from._id,
      username: req.from.username,
      avatar: req.from.avatar,
      sentAt: req.sentAt
    }));

    res.json({ sent, received });
  } catch (error) {
    console.error("Get friend requests error:", error);
    res.status(500).json({ message: "Failed to get friend requests" });
  }
});

// Send friend request (by username)
router.post("/request", async (req, res) => {
  try {
    const { userId, targetUsername } = req.body;

    const cleanUsername = sanitizeUsername(targetUsername);
    if (!cleanUsername) {
      return res.status(400).json({ message: "Invalid username" });
    }

    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({ message: "User not found" });
    }

    const target = await User.findOne({ username: cleanUsername });
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    if (target._id.toString() === userId) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }

    // Check if already friends
    if (sender.friends.includes(target._id)) {
      return res.status(400).json({ message: "Already friends with this user" });
    }

    // Check if request already sent
    const alreadySent = sender.friendRequests?.sent?.some(
      req => req.to.toString() === target._id.toString()
    );
    if (alreadySent) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Check if there's a pending request from target
    const pendingFromTarget = sender.friendRequests?.received?.some(
      req => req.from.toString() === target._id.toString()
    );
    if (pendingFromTarget) {
      return res.status(400).json({ message: "This user already sent you a friend request. Accept it instead!" });
    }

    // Add to sender's sent requests
    if (!sender.friendRequests) {
      sender.friendRequests = { sent: [], received: [] };
    }
    sender.friendRequests.sent.push({ to: target._id });

    // Add to target's received requests
    if (!target.friendRequests) {
      target.friendRequests = { sent: [], received: [] };
    }
    target.friendRequests.received.push({ from: sender._id });

    await sender.save();
    await target.save();

    res.json({
      message: "Friend request sent",
      target: {
        userId: target._id,
        username: target.username,
        avatar: target.avatar
      }
    });
  } catch (error) {
    console.error("Send friend request error:", error);
    res.status(500).json({ message: "Failed to send friend request" });
  }
});

// Accept friend request
router.post("/accept", async (req, res) => {
  try {
    const { userId, fromUserId } = req.body;

    const user = await User.findById(userId);
    const sender = await User.findById(fromUserId);

    if (!user || !sender) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify there's a pending request
    const requestIndex = user.friendRequests?.received?.findIndex(
      req => req.from.toString() === fromUserId
    );

    if (requestIndex === -1 || requestIndex === undefined) {
      return res.status(400).json({ message: "No pending friend request from this user" });
    }

    // Remove from received requests
    user.friendRequests.received.splice(requestIndex, 1);

    // Remove from sender's sent requests
    const senderRequestIndex = sender.friendRequests?.sent?.findIndex(
      req => req.to.toString() === userId
    );
    if (senderRequestIndex !== -1 && senderRequestIndex !== undefined) {
      sender.friendRequests.sent.splice(senderRequestIndex, 1);
    }

    // Add each other as friends
    if (!user.friends.includes(sender._id)) {
      user.friends.push(sender._id);
    }
    if (!sender.friends.includes(user._id)) {
      sender.friends.push(user._id);
    }

    await user.save();
    await sender.save();

    res.json({
      message: "Friend request accepted",
      friend: {
        userId: sender._id,
        username: sender.username,
        avatar: sender.avatar
      }
    });
  } catch (error) {
    console.error("Accept friend request error:", error);
    res.status(500).json({ message: "Failed to accept friend request" });
  }
});

// Reject friend request
router.post("/reject", async (req, res) => {
  try {
    const { userId, fromUserId } = req.body;

    const user = await User.findById(userId);
    const sender = await User.findById(fromUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from received requests
    const requestIndex = user.friendRequests?.received?.findIndex(
      req => req.from.toString() === fromUserId
    );

    if (requestIndex === -1 || requestIndex === undefined) {
      return res.status(400).json({ message: "No pending friend request from this user" });
    }

    user.friendRequests.received.splice(requestIndex, 1);

    // Remove from sender's sent requests if sender exists
    if (sender) {
      const senderRequestIndex = sender.friendRequests?.sent?.findIndex(
        req => req.to.toString() === userId
      );
      if (senderRequestIndex !== -1 && senderRequestIndex !== undefined) {
        sender.friendRequests.sent.splice(senderRequestIndex, 1);
      }
      await sender.save();
    }

    await user.save();

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Reject friend request error:", error);
    res.status(500).json({ message: "Failed to reject friend request" });
  }
});

// Cancel sent friend request
router.post("/cancel", async (req, res) => {
  try {
    const { userId, toUserId } = req.body;

    const user = await User.findById(userId);
    const target = await User.findById(toUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from sent requests
    const requestIndex = user.friendRequests?.sent?.findIndex(
      req => req.to.toString() === toUserId
    );

    if (requestIndex === -1 || requestIndex === undefined) {
      return res.status(400).json({ message: "No pending friend request to this user" });
    }

    user.friendRequests.sent.splice(requestIndex, 1);

    // Remove from target's received requests if target exists
    if (target) {
      const targetRequestIndex = target.friendRequests?.received?.findIndex(
        req => req.from.toString() === userId
      );
      if (targetRequestIndex !== -1 && targetRequestIndex !== undefined) {
        target.friendRequests.received.splice(targetRequestIndex, 1);
      }
      await target.save();
    }

    await user.save();

    res.json({ message: "Friend request cancelled" });
  } catch (error) {
    console.error("Cancel friend request error:", error);
    res.status(500).json({ message: "Failed to cancel friend request" });
  }
});

// Remove friend
router.delete("/:userId/:friendId", async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove friend from user's list
    user.friends = user.friends.filter(id => id.toString() !== friendId);

    // Remove user from friend's list if friend exists
    if (friend) {
      friend.friends = friend.friends.filter(id => id.toString() !== userId);
      await friend.save();
    }

    await user.save();

    res.json({ message: "Friend removed" });
  } catch (error) {
    console.error("Remove friend error:", error);
    res.status(500).json({ message: "Failed to remove friend" });
  }
});

module.exports = router;
