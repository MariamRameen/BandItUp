const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getRoadmap,
  generateRoadmap,
  updateMilestone,
  updateTarget,
} = require("../controllers/roadmapController");

// All routes require authentication
router.use(auth);

// Get user's roadmap
router.get("/", getRoadmap);

// Generate or regenerate roadmap
router.post("/generate", generateRoadmap);

// Update a milestone
router.put("/milestone/:milestoneId", updateMilestone);

// Update target band (regenerates roadmap)
router.put("/target", updateTarget);

module.exports = router;
