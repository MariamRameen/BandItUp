const UserAchievement = require("../models/Achievement");
const { ACHIEVEMENTS } = require("../models/Achievement");

// Get or create user achievements record
const getOrCreateUserAchievements = async (userId) => {
  let userAch = await UserAchievement.findOne({ userId });
  if (!userAch) {
    userAch = new UserAchievement({ userId });
    await userAch.save();
  }
  return userAch;
};

// Get user's achievements and progress
exports.getAchievements = async (req, res) => {
  try {
    const userAch = await getOrCreateUserAchievements(req.user._id);
    
    // Get all achievements with user's unlock status
    const allAchievements = Object.values(ACHIEVEMENTS).map(ach => {
      const unlocked = userAch.unlockedAchievements.find(u => u.achievementId === ach.id);
      return {
        ...ach,
        isUnlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt || null,
      };
    });
    
    // Separate unlocked and locked achievements
    const unlocked = allAchievements.filter(a => a.isUnlocked);
    const locked = allAchievements.filter(a => !a.isUnlocked);
    
    res.json({
      success: true,
      achievements: {
        unlocked,
        locked,
        total: allAchievements.length,
        unlockedCount: unlocked.length,
      },
      stats: {
        totalXP: userAch.totalXP,
        level: userAch.level,
        nextLevelXP: userAch.getNextLevelXP(),
        currentLevelXP: userAch.level > 1 ? UserAchievement.getLevelThresholds()[userAch.level - 1] : 0,
      },
      progress: userAch.progress,
    });
  } catch (err) {
    console.error("Error getting achievements:", err);
    res.status(500).json({ success: false, message: "Failed to load achievements" });
  }
};

// Update progress and check for new achievements
exports.updateProgress = async (req, res) => {
  try {
    const { type, value } = req.body;
    const userAch = await getOrCreateUserAchievements(req.user._id);
    
    // Update the appropriate progress field
    const validTypes = [
      'tasksCompleted', 'listeningCompleted', 'readingCompleted',
      'writingCompleted', 'speakingCompleted', 'vocabLearned',
      'mockTestsCompleted', 'totalMinutes', 'currentStreak',
      'bestStreak', 'bandImprovement'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid progress type" });
    }
    
    // Update progress
    if (type === 'currentStreak' || type === 'bestStreak' || type === 'bandImprovement') {
      userAch.progress[type] = value;
      if (type === 'currentStreak' && value > userAch.progress.bestStreak) {
        userAch.progress.bestStreak = value;
      }
    } else {
      userAch.progress[type] = (userAch.progress[type] || 0) + (value || 1);
    }
    
    // Check for new achievements
    const newAchievements = checkAndUnlockAchievements(userAch);
    
    await userAch.save();
    
    res.json({
      success: true,
      newAchievements,
      progress: userAch.progress,
      stats: {
        totalXP: userAch.totalXP,
        level: userAch.level,
      },
    });
  } catch (err) {
    console.error("Error updating progress:", err);
    res.status(500).json({ success: false, message: "Failed to update progress" });
  }
};

// Check achievements based on progress
function checkAndUnlockAchievements(userAch) {
  const newlyUnlocked = [];
  const progress = userAch.progress;
  
  // Streak achievements
  if (progress.currentStreak >= 1 && !userAch.hasAchievement('first_streak')) {
    const ach = userAch.unlockAchievement('first_streak');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.currentStreak >= 3 && !userAch.hasAchievement('streak_3')) {
    const ach = userAch.unlockAchievement('streak_3');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.currentStreak >= 7 && !userAch.hasAchievement('streak_7')) {
    const ach = userAch.unlockAchievement('streak_7');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.bestStreak >= 30 && !userAch.hasAchievement('streak_30')) {
    const ach = userAch.unlockAchievement('streak_30');
    if (ach) newlyUnlocked.push(ach);
  }
  
  // Task achievements
  if (progress.tasksCompleted >= 10 && !userAch.hasAchievement('tasks_10')) {
    const ach = userAch.unlockAchievement('tasks_10');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.tasksCompleted >= 50 && !userAch.hasAchievement('tasks_50')) {
    const ach = userAch.unlockAchievement('tasks_50');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.tasksCompleted >= 100 && !userAch.hasAchievement('tasks_100')) {
    const ach = userAch.unlockAchievement('tasks_100');
    if (ach) newlyUnlocked.push(ach);
  }
  
  // Skill mastery achievements
  if (progress.listeningCompleted >= 20 && !userAch.hasAchievement('listening_master')) {
    const ach = userAch.unlockAchievement('listening_master');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.readingCompleted >= 20 && !userAch.hasAchievement('reading_master')) {
    const ach = userAch.unlockAchievement('reading_master');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.writingCompleted >= 20 && !userAch.hasAchievement('writing_master')) {
    const ach = userAch.unlockAchievement('writing_master');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.speakingCompleted >= 20 && !userAch.hasAchievement('speaking_master')) {
    const ach = userAch.unlockAchievement('speaking_master');
    if (ach) newlyUnlocked.push(ach);
  }
  
  // Mock test achievements
  if (progress.mockTestsCompleted >= 1 && !userAch.hasAchievement('first_mock')) {
    const ach = userAch.unlockAchievement('first_mock');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.mockTestsCompleted >= 5 && !userAch.hasAchievement('mock_5')) {
    const ach = userAch.unlockAchievement('mock_5');
    if (ach) newlyUnlocked.push(ach);
  }
  
  // Time-based achievements
  if (progress.totalMinutes >= 60 && !userAch.hasAchievement('study_1hr')) {
    const ach = userAch.unlockAchievement('study_1hr');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.totalMinutes >= 600 && !userAch.hasAchievement('study_10hr')) {
    const ach = userAch.unlockAchievement('study_10hr');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.totalMinutes >= 3000 && !userAch.hasAchievement('study_50hr')) {
    const ach = userAch.unlockAchievement('study_50hr');
    if (ach) newlyUnlocked.push(ach);
  }
  
  // Vocabulary achievements
  if (progress.vocabLearned >= 100 && !userAch.hasAchievement('vocab_100')) {
    const ach = userAch.unlockAchievement('vocab_100');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.vocabLearned >= 500 && !userAch.hasAchievement('vocab_500')) {
    const ach = userAch.unlockAchievement('vocab_500');
    if (ach) newlyUnlocked.push(ach);
  }
  
  // Band improvement achievements
  if (progress.bandImprovement >= 0.5 && !userAch.hasAchievement('band_up_05')) {
    const ach = userAch.unlockAchievement('band_up_05');
    if (ach) newlyUnlocked.push(ach);
  }
  if (progress.bandImprovement >= 1.0 && !userAch.hasAchievement('band_up_10')) {
    const ach = userAch.unlockAchievement('band_up_10');
    if (ach) newlyUnlocked.push(ach);
  }
  
  return newlyUnlocked;
}

// Award target reached achievement
exports.awardTargetReached = async (userId) => {
  try {
    const userAch = await getOrCreateUserAchievements(userId);
    if (!userAch.hasAchievement('target_reached')) {
      const ach = userAch.unlockAchievement('target_reached');
      await userAch.save();
      return ach;
    }
    return null;
  } catch (err) {
    console.error("Error awarding target achievement:", err);
    return null;
  }
};

// Get leaderboard by XP
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await UserAchievement.find({})
      .sort({ totalXP: -1 })
      .limit(limit)
      .populate('userId', 'name avatar')
      .lean();
    
    // Find current user's rank
    const userAch = await UserAchievement.findOne({ userId: req.user._id });
    let userRank = null;
    if (userAch) {
      const higherCount = await UserAchievement.countDocuments({
        totalXP: { $gt: userAch.totalXP }
      });
      userRank = higherCount + 1;
    }
    
    res.json({
      success: true,
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        name: entry.userId?.name || 'Anonymous',
        avatar: entry.userId?.avatar || null,
        level: entry.level,
        totalXP: entry.totalXP,
        isCurrentUser: entry.userId?._id?.toString() === req.user._id.toString(),
      })),
      userRank,
    });
  } catch (err) {
    console.error("Error getting leaderboard:", err);
    res.status(500).json({ success: false, message: "Failed to load leaderboard" });
  }
};

// Helper to sync progress from existing data
exports.syncProgress = async (req, res) => {
  try {
    const userAch = await getOrCreateUserAchievements(req.user._id);
    const { progress } = req.body;
    
    // Merge provided progress
    if (progress) {
      Object.keys(progress).forEach(key => {
        if (typeof progress[key] === 'number') {
          userAch.progress[key] = progress[key];
        }
      });
    }
    
    // Check for achievements
    const newAchievements = checkAndUnlockAchievements(userAch);
    await userAch.save();
    
    res.json({
      success: true,
      newAchievements,
      progress: userAch.progress,
      stats: {
        totalXP: userAch.totalXP,
        level: userAch.level,
      },
    });
  } catch (err) {
    console.error("Error syncing progress:", err);
    res.status(500).json({ success: false, message: "Failed to sync progress" });
  }
};

// Export helper for use in other controllers
exports.getOrCreateUserAchievements = getOrCreateUserAchievements;
exports.checkAndUnlockAchievements = checkAndUnlockAchievements;
