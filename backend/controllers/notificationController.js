const Notification = require("../models/Notification");
const NotificationSettings = require("../models/NotificationSettings");

// Get user's notifications (paginated)
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';
    
    const query = { userId: req.user._id };
    if (unreadOnly) {
      query.isRead = false;
    }
    
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);
    
    res.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error getting notifications:", err);
    res.status(500).json({ success: false, message: "Failed to load notifications" });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);
    res.json({ success: true, count });
  } catch (err) {
    console.error("Error getting unread count:", err);
    res.status(500).json({ success: false, message: "Failed to get unread count" });
  }
};

// Mark single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    
    res.json({ success: true, notification });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user._id);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error marking all as read:", err);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const result = await Notification.deleteOne({
      _id: notificationId,
      userId: req.user._id,
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};

// Get notification settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await NotificationSettings.getOrCreate(req.user._id);
    res.json({ success: true, settings });
  } catch (err) {
    console.error("Error getting notification settings:", err);
    res.status(500).json({ success: false, message: "Failed to load settings" });
  }
};

// Update notification settings
exports.updateSettings = async (req, res) => {
  try {
    const allowedFields = [
      'pushEnabled', 'emailEnabled', 'dailyReminders',
      'dailyReminderTime', 'weeklyProgressReport', 'mockTestReminders',
      'achievementNotifications', 'streakReminders', 'studyTips', 'timezone',
    ];
    
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    const settings = await NotificationSettings.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, settings });
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};

// Helper: Create notification (internal use)
exports.createNotification = async (userId, type, title, message, options = {}) => {
  try {
    // Check user's notification settings
    const settings = await NotificationSettings.getOrCreate(userId);
    
    // Check if this notification type is enabled
    const typeSettings = {
      achievement: settings.achievementNotifications,
      study_reminder: settings.dailyReminders,
      streak_warning: settings.streakReminders,
      streak_broken: settings.streakReminders,
      progress_report: settings.weeklyProgressReport,
      mock_test_due: settings.mockTestReminders,
      tip: settings.studyTips,
      welcome: true,
      milestone_reached: true,
      roadmap_update: true,
    };
    
    if (!settings.pushEnabled || !typeSettings[type]) {
      return null; // User has disabled this type of notification
    }
    
    const notification = await Notification.createNotification(
      userId, type, title, message, options
    );
    
    return notification;
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
};

// Helper: Send welcome notification
exports.sendWelcomeNotification = async (userId, userName) => {
  return await exports.createNotification(
    userId,
    'welcome',
    `Welcome to BandItUp, ${userName}! 👋`,
    'Start your IELTS journey by taking the baseline test to get personalized recommendations.',
    { link: '/baseline', icon: '👋' }
  );
};

// Helper: Send achievement notification
exports.sendAchievementNotification = async (userId, achievement) => {
  return await exports.createNotification(
    userId,
    'achievement',
    `Achievement Unlocked: ${achievement.name}! 🏆`,
    achievement.description,
    {
      data: { achievementId: achievement.id, xp: achievement.xp },
      link: '/study-planner/achievements',
      icon: achievement.icon || '🏆',
    }
  );
};

// Helper: Send streak warning notification
exports.sendStreakWarning = async (userId, currentStreak) => {
  return await exports.createNotification(
    userId,
    'streak_warning',
    `Keep your ${currentStreak}-day streak alive! 🔥`,
    "You haven't practiced today yet. A quick 10-minute session will keep your streak going!",
    { link: '/study-planner', icon: '⚠️' }
  );
};

// Helper: Send milestone reached notification
exports.sendMilestoneReached = async (userId, milestone) => {
  return await exports.createNotification(
    userId,
    'milestone_reached',
    `Milestone Completed: Week ${milestone.weekNumber}! 🎯`,
    `Congratulations! You've reached your Week ${milestone.weekNumber} target. Keep up the great work!`,
    {
      data: { milestoneId: milestone._id },
      link: '/study-planner/roadmap',
      icon: '🎯',
    }
  );
};

// Helper: Update user activity (call this when user does any activity)
exports.updateUserActivity = async (userId) => {
  try {
    await NotificationSettings.updateActivity(userId);
  } catch (err) {
    console.error("Error updating user activity:", err);
  }
};
