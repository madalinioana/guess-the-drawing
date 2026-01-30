const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      type: String,
      default: "😀",
    },
    stats: {
      gamesPlayed: {
        type: Number,
        default: 0,
      },
      gamesWon: {
        type: Number,
        default: 0,
      },
      totalScore: {
        type: Number,
        default: 0,
      },
      correctGuesses: {
        type: Number,
        default: 0,
      },
      drawingsCompleted: {
        type: Number,
        default: 0,
      },
    },
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    friendRequests: {
      sent: [{
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        sentAt: {
          type: Date,
          default: Date.now
        }
      }],
      received: [{
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        sentAt: {
          type: Date,
          default: Date.now
        }
      }]
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicProfile = function () {
  return {
    userId: this._id,
    username: this.username,
    avatar: this.avatar,
    stats: this.stats,
    createdAt: this.createdAt,
  };
};

userSchema.statics.getLeaderboard = async function (limit = 50) {
  return this.find({})
    .select("username avatar stats createdAt")
    .sort({ "stats.totalScore": -1 })
    .limit(limit)
    .lean();
};

const User = mongoose.model("User", userSchema);

module.exports = User;
