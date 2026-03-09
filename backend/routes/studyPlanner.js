const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getPlan,
  completeTask,
  getProgress,
  regeneratePlan,
  updateTarget,
} = require("../controllers/studyPlannerController");
const {
  generateWeeklyReport,
  generateDailySummary,
  getProgressTimeline,
} = require("../services/progressReportService");

// All routes require authentication
router.use(auth);

// Get current study plan (creates if doesn't exist)
router.get("/plan", getPlan);

// Mark a task as completed
router.post("/task/complete", completeTask);

// Get detailed progress analytics
router.get("/progress", getProgress);

// Regenerate the study plan (e.g., after mock test)
router.post("/regenerate", regeneratePlan);

// Update target band
router.put("/target", updateTarget);

// Get weekly progress report
router.get("/report/weekly", async (req, res) => {
  try {
    const report = await generateWeeklyReport(req.user._id);
    if (!report) {
      return res.status(404).json({ success: false, message: "No data available for report" });
    }
    res.json({ success: true, report });
  } catch (err) {
    console.error("Error getting weekly report:", err);
    res.status(500).json({ success: false, message: "Failed to generate report" });
  }
});

// Get daily summary
router.get("/report/daily", async (req, res) => {
  try {
    const summary = await generateDailySummary(req.user._id);
    if (!summary) {
      return res.status(404).json({ success: false, message: "No data available" });
    }
    res.json({ success: true, summary });
  } catch (err) {
    console.error("Error getting daily summary:", err);
    res.status(500).json({ success: false, message: "Failed to generate summary" });
  }
});

// Get progress timeline (for charts)
router.get("/report/timeline", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const timeline = await getProgressTimeline(req.user._id, days);
    res.json({ success: true, timeline });
  } catch (err) {
    console.error("Error getting timeline:", err);
    res.status(500).json({ success: false, message: "Failed to get timeline" });
  }
});

module.exports = router;
