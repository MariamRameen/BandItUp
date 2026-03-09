const mongoose = require("mongoose");

// Achievement Definitions
const ACHIEVEMENTS = {
  // Streak achievements
  FIRST_STREAK: { id: 'first_streak', name: 'Getting Started', description: 'Complete your first study session', xp: 10, icon: '🌟' },
  STREAK_3: { id: 'streak_3', name: '3 Day Streak', description: 'Study 3 days in a row', xp: 25, icon: '🔥' },
  STREAK_7: { id: 'streak_7', name: 'Weekly Warrior', description: 'Study 7 days in a row', xp: 50, icon: '⚔️' },
  STREAK_30: { id: 'streak_30', name: 'Month Master', description: 'Study 30 days in a row', xp: 200, icon: '👑' },
  
  // Task completion
  TASKS_10: { id: 'tasks_10', name: 'Task Starter', description: 'Complete 10 tasks', xp: 20, icon: '✅' },
  TASKS_50: { id: 'tasks_50', name: 'Task Achiever', description: 'Complete 50 tasks', xp: 75, icon: '🎯' },
  TASKS_100: { id: 'tasks_100', name: 'Century Club', description: 'Complete 100 tasks', xp: 150, icon: '💯' },
  
  // Band improvements
  BAND_UP_05: { id: 'band_up_05', name: 'Rising Star', description: 'Improve by 0.5 bands', xp: 100, icon: '⬆️' },
  BAND_UP_10: { id: 'band_up_10', name: 'Level Up', description: 'Improve by 1.0 bands', xp: 200, icon: '🚀' },
  TARGET_REACHED: { id: 'target_reached', name: 'Goal Achieved', description: 'Reach your target band', xp: 500, icon: '🏆' },
  
  // Skill-specific
  LISTENING_MASTER: { id: 'listening_master', name: 'Listening Pro', description: 'Complete 20 listening exercises', xp: 50, icon: '🎧' },
  READING_MASTER: { id: 'reading_master', name: 'Reading Pro', description: 'Complete 20 reading sessions', xp: 50, icon: '📖' },
  WRITING_MASTER: { id: 'writing_master', name: 'Writing Pro', description: 'Complete 20 writing tasks', xp: 50, icon: '✍️' },
  SPEAKING_MASTER: { id: 'speaking_master', name: 'Speaking Pro', description: 'Complete 20 speaking sessions', xp: 50, icon: '🎤' },
  
  // Mock tests
  FIRST_MOCK: { id: 'first_mock', name: 'Test Taker', description: 'Complete your first mock test', xp: 30, icon: '📝' },
  MOCK_5: { id: 'mock_5', name: 'Consistent Tester', description: 'Complete 5 mock tests', xp: 100, icon: '🧪' },
  
  // Time-based
  STUDY_1HR: { id: 'study_1hr', name: 'Hour Power', description: 'Study for 1 hour total', xp: 15, icon: '⏱️' },
  STUDY_10HR: { id: 'study_10hr', name: 'Dedicated Learner', description: 'Study for 10 hours total', xp: 75, icon: '📚' },
  STUDY_50HR: { id: 'study_50hr', name: 'Study Expert', description: 'Study for 50 hours total', xp: 200, icon: '🎓' },
  
  // Vocabulary
  VOCAB_100: { id: 'vocab_100', name: 'Word Collector', description: 'Learn 100 vocabulary words', xp: 50, icon: '📕' },
  VOCAB_500: { id: 'vocab_500', name: 'Vocabulary Master', description: 'Learn 500 vocabulary words', xp: 150, icon: '📗' },
};

// XP thresholds for levels
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1900,   // Level 7
  2600,   // Level 8
  3500,   // Level 9
  4600,   // Level 10
  6000,   // Level 11+
];

const UnlockedAchievementSchema = new mongoose.Schema({
  achievementId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
  xpAwarded: { type: Number, required: true },
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  tasksCompleted: { type: Number, default: 0 },
  listeningCompleted: { type: Number, default: 0 },
  readingCompleted: { type: Number, default: 0 },
  writingCompleted: { type: Number, default: 0 },
  speakingCompleted: { type: Number, default: 0 },
  vocabLearned: { type: Number, default: 0 },
  mockTestsCompleted: { type: Number, default: 0 },
  totalMinutes: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  bandImprovement: { type: Number, default: 0 },
}, { _id: false });

const UserAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  totalXP: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  unlockedAchievements: [UnlockedAchievementSchema],
  progress: { type: ProgressSchema, default: () => ({}) },
}, { timestamps: true });

// Calculate level from XP
UserAchievementSchema.methods.calculateLevel = function () {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (this.totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

// Get XP needed for next level
UserAchievementSchema.methods.getNextLevelXP = function () {
  const currentLevelIdx = this.level - 1;
  if (currentLevelIdx + 1 < LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[currentLevelIdx + 1];
  }
  // For max level, show current XP as threshold
  return this.totalXP;
};

// Check if achievement is unlocked
UserAchievementSchema.methods.hasAchievement = function (achievementId) {
  return this.unlockedAchievements.some(a => a.achievementId === achievementId);
};

// Unlock an achievement
UserAchievementSchema.methods.unlockAchievement = function (achievementId) {
  const achievement = ACHIEVEMENTS[Object.keys(ACHIEVEMENTS).find(
    key => ACHIEVEMENTS[key].id === achievementId
  )];
  
  if (!achievement || this.hasAchievement(achievementId)) {
    return null;
  }
  
  this.unlockedAchievements.push({
    achievementId: achievement.id,
    xpAwarded: achievement.xp,
    unlockedAt: new Date(),
  });
  
  this.totalXP += achievement.xp;
  this.level = this.calculateLevel();
  
  return achievement;
};

// Static method to get all achievement definitions
UserAchievementSchema.statics.getAllAchievements = function () {
  return Object.values(ACHIEVEMENTS);
};

// Static method to get level thresholds
UserAchievementSchema.statics.getLevelThresholds = function () {
  return LEVEL_THRESHOLDS;
};

module.exports = mongoose.model("UserAchievement", UserAchievementSchema);
module.exports.ACHIEVEMENTS = ACHIEVEMENTS;
module.exports.LEVEL_THRESHOLDS = LEVEL_THRESHOLDS;
