const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sanitizeInput, sanitizeUsername } = require("../utils/sanitize");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Sanitize inputs
    const cleanUsername = sanitizeUsername(username);
    const cleanEmail = sanitizeInput(email);

    if (!cleanUsername) {
      return res.status(400).json({ message: "Invalid username" });
    }

    if (!cleanEmail || !cleanEmail.match(/^\S+@\S+\.\S+$/)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail.toLowerCase() }],
    });

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new user
    const user = new User({
      username: cleanUsername,
      email: cleanEmail.toLowerCase(),
      password,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      userId: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token,
      stats: user.stats,
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username or email already exists" });
    }
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const cleanUsername = sanitizeUsername(username);

    if (!cleanUsername || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ username: cleanUsername }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      userId: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token,
      stats: user.stats,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// Verify token
router.post("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      userId: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      stats: user.stats,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

// Update profile
router.patch("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { avatar } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();

    res.json({
      userId: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      stats: user.stats,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
