const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Report = require("../models/Report");

const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


router.use(auth);
router.use(isAdmin);



router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select(
      "-passwordHash -googleId -resetPasswordToken -resetPasswordExpiry"
    );
    res.json({ success: true, users });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: "admin" });
    const premiumUsers = await User.countDocuments({ subscriptionStatus: "premium" });
    const freeUsers = await User.countDocuments({ subscriptionStatus: "free_trial" });
    const academicUsers = await User.countDocuments({ examType: "Academic" });
    const generalUsers = await User.countDocuments({ examType: "General Training" });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await User.countDocuments({ lastLogin: { $gte: today } });

    res.json({
      success: true,
      stats: {
        totalUsers, adminUsers, premiumUsers, freeUsers,
        academicUsers, generalUsers, verifiedUsers, newUsers, activeToday,
      },
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/users/:userId/role", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot change your own role" });
    }
    user.role = role;
    await user.save();
    res.json({ success: true, message: `User role updated to ${role}`, user: { id: user._id, role: user.role } });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete yourself" });
    }
    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot delete admin users" });
    }
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── REPORTS ─────────────────────────────────────────────────────────────────


router.get("/reports", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== "all" ? { status } : {};
    const reports = await Report.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    console.error("Get reports error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/reports/:reportId/reply", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    report.replies.push({ message, sentBy: "admin", senderName: req.user.displayName });
    if (report.status === "open") report.status = "in_progress";
    await report.save();

    res.json({ success: true, report });
  } catch (err) {
    console.error("Admin reply error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.put("/reports/:reportId/status", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!["open", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    res.json({ success: true, report });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;