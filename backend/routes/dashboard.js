const express = require("express");
const router = express.Router();
const { getDashboard } = require("../controllers/dashboardController");
const auth = require("../middleware/auth");

// GET /api/dashboard - Get aggregated dashboard data
router.get("/", auth, getDashboard);

module.exports = router;
