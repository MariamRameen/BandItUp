const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'study_reminder',
      'mock_test_due',
      'progress_report', 
      'achievement',
      'streak_warning',
      'streak_broken',
      'tip',
      'welcome',
      'milestone_reached',
      'roadmap_update',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  link: { type: String }, // Route to navigate to when clicked
  icon: { type: String }, // Emoji or icon identifier
  isRead: { type: Boolean, default: false },
  isEmailed: { type: Boolean, default: false },
  scheduledFor: { type: Date },
  sentAt: { type: Date },
}, { timestamps: true });

// Index for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ scheduledFor: 1, sentAt: 1 });

// Static method to create a notification
NotificationSchema.statics.createNotification = async function (userId, type, title, message, options = {}) {
  const notification = new this({
    userId,
    type,
    title,
    message,
    data: options.data || {},
    link: options.link || null,
    icon: options.icon || getDefaultIcon(type),
    scheduledFor: options.scheduledFor || new Date(),
    sentAt: new Date(),
  });
  return await notification.save();
};

// Get unread count for user
NotificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({ userId, isRead: false });
};

// Mark all notifications as read for user
NotificationSchema.statics.markAllAsRead = async function (userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );
};

function getDefaultIcon(type) {
  const icons = {
    study_reminder: '📚',
    mock_test_due: '📝',
    progress_report: '📊',
    achievement: '🏆',
    streak_warning: '⚠️',
    streak_broken: '💔',
    tip: '💡',
    welcome: '👋',
    milestone_reached: '🎯',
    roadmap_update: '🗺️',
  };
  return icons[type] || '🔔';
}

module.exports = mongoose.model("Notification", NotificationSchema);
