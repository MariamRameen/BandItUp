const NotificationSettings = require("../models/NotificationSettings");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { createNotification } = require("../controllers/notificationController");

// Re-engagement message templates
const RE_ENGAGE_MESSAGES = {
  after_3_days: {
    title: "We miss you! 👋",
    message: "You haven't practiced in 3 days. A quick 10-minute session can help maintain your progress!",
    icon: "👋",
  },
  after_7_days: {
    title: "Your IELTS journey awaits 📚",
    message: "It's been a week since your last session. Let's get back on track together!",
    icon: "📚",
  },
  after_14_days: {
    title: "Start fresh today! 🌟",
    message: "Two weeks have passed. Your goals are still achievable - let's make today the day you restart!",
    icon: "🌟",
  },
  streak_lost: {
    title: "Your streak ended 😢",
    message: "Start a new streak today! Remember, consistency is key to improvement.",
    icon: "💔",
  },
};

// Check user activity and send re-engagement notifications
async function checkUserActivity() {
  try {
    const now = new Date();
    
    // Find users with activity settings
    const userSettings = await NotificationSettings.find({
      pushEnabled: true,
    }).lean();
    
    for (const settings of userSettings) {
      const lastActivity = settings.lastActivityAt;
      if (!lastActivity) continue;
      
      const daysSinceActivity = Math.floor(
        (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Skip if user was active recently
      if (daysSinceActivity < 3) continue;
      
      // Check if we already sent a notification recently
      const lastReminder = settings.lastReminderSentAt;
      if (lastReminder) {
        const hoursSinceReminder = (now.getTime() - new Date(lastReminder).getTime()) / (1000 * 60 * 60);
        // Don't send more than one reminder per 24 hours
        if (hoursSinceReminder < 24) continue;
      }
      
      // Select appropriate message based on inactivity duration
      let messageKey;
      if (daysSinceActivity >= 14) {
        messageKey = 'after_14_days';
      } else if (daysSinceActivity >= 7) {
        messageKey = 'after_7_days';
      } else {
        messageKey = 'after_3_days';
      }
      
      const msgTemplate = RE_ENGAGE_MESSAGES[messageKey];
      
      // Create notification
      await createNotification(
        settings.userId,
        'study_reminder',
        msgTemplate.title,
        msgTemplate.message,
        {
          icon: msgTemplate.icon,
          link: '/study-planner',
          data: { daysInactive: daysSinceActivity },
        }
      );
      
      // Update last reminder sent time
      await NotificationSettings.updateOne(
        { userId: settings.userId },
        { $set: { lastReminderSentAt: now } }
      );
    }
    
    console.log(`[ReengagementJob] Checked ${userSettings.length} users for inactivity`);
  } catch (err) {
    console.error("[ReengagementJob] Error:", err);
  }
}

// Get user's inactivity status (for frontend)
async function getInactivityStatus(userId) {
  try {
    const settings = await NotificationSettings.findOne({ userId });
    if (!settings || !settings.lastActivityAt) {
      return { isInactive: false, daysInactive: 0 };
    }
    
    const now = new Date();
    const lastActivity = new Date(settings.lastActivityAt);
    const daysSinceActivity = Math.floor(
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let message = null;
    if (daysSinceActivity >= 14) {
      message = RE_ENGAGE_MESSAGES.after_14_days;
    } else if (daysSinceActivity >= 7) {
      message = RE_ENGAGE_MESSAGES.after_7_days;
    } else if (daysSinceActivity >= 3) {
      message = RE_ENGAGE_MESSAGES.after_3_days;
    }
    
    return {
      isInactive: daysSinceActivity >= 3,
      daysInactive: daysSinceActivity,
      lastActivity: settings.lastActivityAt,
      message,
    };
  } catch (err) {
    console.error("Error getting inactivity status:", err);
    return { isInactive: false, daysInactive: 0 };
  }
}

// Mark user as returned (dismiss welcome back)
async function markUserReturned(userId) {
  try {
    await NotificationSettings.updateOne(
      { userId },
      { $set: { lastActivityAt: new Date() } }
    );
    return true;
  } catch (err) {
    console.error("Error marking user returned:", err);
    return false;
  }
}

module.exports = {
  checkUserActivity,
  getInactivityStatus,
  markUserReturned,
  RE_ENGAGE_MESSAGES,
};
