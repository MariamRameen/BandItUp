const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getMockTests,
  scheduleMockTest,
  startMockTest,
  completeMockTest,
  getMockTest,
  getProgress,
  quickMockTest,
  updateSection,
} = require("../controllers/mockTestController");

// All routes require authentication
router.use(auth);

// Get all mock tests for user
router.get("/", getMockTests);

// Get progress/trajectory
router.get("/progress", getProgress);

// Schedule a new mock test
router.post("/schedule", scheduleMockTest);

// Quick start a mock test
router.post("/quick", quickMockTest);

// Get specific mock test
router.get("/:id", getMockTest);

// Start a mock test
router.post("/:id/start", startMockTest);

// Update a section result
router.post("/:id/section", updateSection);

// Complete a mock test
router.post("/:id/complete", completeMockTest);

module.exports = router;
