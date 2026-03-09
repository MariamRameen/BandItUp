const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAchievements,
  updateProgress,
  getLeaderboard,
  syncProgress,
} = require("../controllers/achievementController");

// Get user's achievements and stats
router.get("/", auth, getAchievements);

// Update progress (called by other modules when tasks completed)
router.post("/progress", auth, updateProgress);

// Sync progress from existing data
router.post("/sync", auth, syncProgress);

// Get leaderboard
router.get("/leaderboard", auth, getLeaderboard);

module.exports = router;
