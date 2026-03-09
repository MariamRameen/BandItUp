const mongoose = require("mongoose");

const NotificationSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  // Global settings
  pushEnabled: { type: Boolean, default: true },
  emailEnabled: { type: Boolean, default: true },
  
  // Reminder settings
  dailyReminders: { type: Boolean, default: true },
  dailyReminderTime: { type: String, default: '09:00' }, // HH:mm format
  
  // Notification types
  weeklyProgressReport: { type: Boolean, default: true },
  mockTestReminders: { type: Boolean, default: true },
  achievementNotifications: { type: Boolean, default: true },
  streakReminders: { type: Boolean, default: true },
  studyTips: { type: Boolean, default: true },
  
  // Timezone for scheduling
  timezone: { type: String, default: 'UTC' },
  
  // Last activity tracking for re-engagement
  lastActivityAt: { type: Date, default: Date.now },
  lastReminderSentAt: { type: Date },
  
}, { timestamps: true });

// Get or create settings for user
NotificationSettingsSchema.statics.getOrCreate = async function (userId) {
  let settings = await this.findOne({ userId });
  if (!settings) {
    settings = new this({ userId });
    await settings.save();
  }
  return settings;
};

// Update last activity
NotificationSettingsSchema.statics.updateActivity = async function (userId) {
  return await this.findOneAndUpdate(
    { userId },
    { $set: { lastActivityAt: new Date() } },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model("NotificationSettings", NotificationSettingsSchema);
