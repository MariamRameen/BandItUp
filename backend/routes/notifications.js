const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getSettings,
  updateSettings,
} = require("../controllers/notificationController");
const { getInactivityStatus, markUserReturned } = require("../services/reengagementService");

// Get paginated notifications
router.get("/", auth, getNotifications);

// Get unread count
router.get("/unread", auth, getUnreadCount);

// Get notification settings
router.get("/settings", auth, getSettings);

// Get inactivity status (for welcome back screen)
router.get("/inactivity", auth, async (req, res) => {
  try {
    const status = await getInactivityStatus(req.user._id);
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get inactivity status" });
  }
});

// Mark user as returned (dismiss welcome back)
router.post("/returned", auth, async (req, res) => {
  try {
    await markUserReturned(req.user._id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

// Update notification settings
router.put("/settings", auth, updateSettings);

// Mark all notifications as read
router.put("/read-all", auth, markAllAsRead);

// Mark single notification as read
router.put("/:notificationId/read", auth, markAsRead);

// Delete a notification
router.delete("/:notificationId", auth, deleteNotification);

module.exports = router;
