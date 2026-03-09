const mongoose = require("mongoose");
const StudyPlan = require("../models/StudyPlan");
const UserAchievement = require("../models/Achievement");
const User = require("../models/User");

// Generate weekly progress report for a user
async function generateWeeklyReport(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;
    
    const studyPlan = await StudyPlan.findOne({ userId }).lean();
    const userAchievements = await UserAchievement.findOne({ userId }).lean();
    
    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // Count completed tasks this week
    let tasksCompleted = 0;
    let minutesPracticed = 0;
    const skillSessions = {
      listening: 0,
      reading: 0,
      writing: 0,
      speaking: 0,
      vocabulary: 0,
    };
    
    if (studyPlan && studyPlan.dailyTasks) {
      Object.values(studyPlan.dailyTasks).forEach((dayTasks) => {
        dayTasks.forEach((task) => {
          if (task.isCompleted && task.completedAt) {
            const completedDate = new Date(task.completedAt);
            if (completedDate >= startDate && completedDate <= endDate) {
              tasksCompleted++;
              minutesPracticed += task.duration || 0;
              if (skillSessions[task.skill]) {
                skillSessions[task.skill]++;
              }
            }
          }
        });
      });
    }
    
    // Get recent achievements
    let recentAchievements = [];
    if (userAchievements && userAchievements.unlockedAchievements) {
      recentAchievements = userAchievements.unlockedAchievements
        .filter((a) => new Date(a.unlockedAt) >= startDate)
        .map((a) => ({
          achievementId: a.achievementId,
          unlockedAt: a.unlockedAt,
        }));
    }
    
    // Generate motivational message
    const motivationalMessages = [
      "Great progress this week! Keep up the momentum!",
      "You're building strong foundations for IELTS success!",
      "Consistency is your superpower. You're doing great!",
      "Every session brings you closer to your target band!",
      "Your dedication is inspiring. Keep pushing forward!",
    ];
    
    const report = {
      userId,
      period: { start: startDate, end: endDate },
      generatedAt: new Date(),
      summary: {
        tasksCompleted,
        minutesPracticed,
        sessionsCompleted: Object.values(skillSessions).reduce((a, b) => a + b, 0),
        streakMaintained: studyPlan?.streak > 0,
        currentStreak: studyPlan?.streak || 0,
      },
      bandProgress: {
        baseline: user.baselineBand || 0,
        current: user.currentBand || user.baselineBand || 0,
        target: user.targetBand || 0,
        change: (user.currentBand || 0) - (user.baselineBand || 0),
      },
      skillBreakdown: Object.entries(skillSessions).map(([skill, sessions]) => ({
        skill,
        sessions,
        status: sessions >= 3 ? 'Excellent' : sessions >= 1 ? 'Good' : 'Needs Focus',
      })),
      achievements: recentAchievements,
      stats: {
        totalXP: userAchievements?.totalXP || 0,
        level: userAchievements?.level || 1,
      },
      nextWeekFocus: getNextWeekFocus(skillSessions),
      motivationalMessage: motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
    };
    
    return report;
  } catch (err) {
    console.error("Error generating weekly report:", err);
    return null;
  }
}

// Determine what to focus on next week
function getNextWeekFocus(skillSessions) {
  const skills = Object.entries(skillSessions);
  const weakest = skills.reduce((min, curr) => 
    curr[1] < min[1] ? curr : min, skills[0]
  );
  
  const focusMessages = {
    listening: "Focus on listening comprehension and note-taking skills",
    reading: "Prioritize reading speed and passage analysis",
    writing: "Work on essay structure and vocabulary variety",
    speaking: "Practice fluency and pronunciation",
    vocabulary: "Expand your academic vocabulary range",
  };
  
  return focusMessages[weakest[0]] || "Continue balanced practice across all skills";
}

// Generate daily summary
async function generateDailySummary(userId) {
  try {
    const studyPlan = await StudyPlan.findOne({ userId }).lean();
    if (!studyPlan) return null;
    
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1; // Convert to 0=Mon
    const todaysTasks = studyPlan.dailyTasks?.[String(dayIndex)] || [];
    
    const completed = todaysTasks.filter((t) => t.isCompleted).length;
    const total = todaysTasks.length;
    const minutesPracticed = todaysTasks
      .filter((t) => t.isCompleted)
      .reduce((sum, t) => sum + (t.duration || 0), 0);
    
    return {
      date: new Date(),
      tasksCompleted: completed,
      totalTasks: total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      minutesPracticed,
      streak: studyPlan.streak || 0,
    };
  } catch (err) {
    console.error("Error generating daily summary:", err);
    return null;
  }
}

// Get progress over time (for charts)
async function getProgressTimeline(userId, days = 30) {
  try {
    const studyPlan = await StudyPlan.findOne({ userId }).lean();
    if (!studyPlan) return [];
    
    // Generate timeline data from study plan history
    // This is a simplified version - in production, you'd track daily progress
    const timeline = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      timeline.push({
        date: date.toISOString().split('T')[0],
        tasksCompleted: Math.floor(Math.random() * 5), // Placeholder
        minutesPracticed: Math.floor(Math.random() * 60), // Placeholder
      });
    }
    
    return timeline;
  } catch (err) {
    console.error("Error getting progress timeline:", err);
    return [];
  }
}

module.exports = {
  generateWeeklyReport,
  generateDailySummary,
  getProgressTimeline,
};
