const OpenAI = require("openai");
const StudyPlan = require("../models/StudyPlan");
const BaselineResult = require("../models/BaselineResult");
const User = require("../models/User");
const ListeningProgress = require("../models/ListeningProgress");
const { v4: uuidv4 } = require("uuid");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helper Functions ─────────────────────────────────────

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function identifyWeakSkills(scores, targetBand) {
  const gaps = [];
  for (const [skill, band] of Object.entries(scores)) {
    if (band && band < targetBand) {
      gaps.push({ skill, currentBand: band, gap: targetBand - band });
    }
  }
  return gaps.sort((a, b) => b.gap - a.gap); // Biggest gaps first
}

const TASK_TEMPLATES = {
  listening: [
    { type: "practice", title: "Listening Practice", desc: "Complete a listening exercise", duration: 15 },
    { type: "dictation", title: "Dictation Drill", desc: "Practice note-taking accuracy", duration: 10 },
    { type: "mock", title: "Listening Section Test", desc: "Timed listening section", duration: 30 },
  ],
  reading: [
    { type: "practice", title: "Reading Passage", desc: "Practice with timed reading", duration: 20 },
    { type: "skim-scan", title: "Skim & Scan Drill", desc: "Speed reading practice", duration: 10 },
    { type: "mock", title: "Reading Section Test", desc: "Full timed section", duration: 20 },
  ],
  writing: [
    { type: "task1", title: "Writing Task 1", desc: "Graph/letter description", duration: 20 },
    { type: "task2", title: "Writing Task 2", desc: "Essay practice", duration: 40 },
    { type: "review", title: "Grammar Review", desc: "Review previous essay feedback", duration: 15 },
  ],
  speaking: [
    { type: "part1", title: "Speaking Part 1", desc: "Practice introduction questions", duration: 10 },
    { type: "part2", title: "Speaking Part 2", desc: "Cue card practice", duration: 15 },
    { type: "part3", title: "Speaking Part 3", desc: "Discussion practice", duration: 15 },
  ],
  vocabulary: [
    { type: "flashcards", title: "Vocabulary Review", desc: "Flashcard session", duration: 10 },
    { type: "quiz", title: "Vocabulary Quiz", desc: "Test your word knowledge", duration: 10 },
    { type: "contextual", title: "Words in Context", desc: "Learn words in sentences", duration: 15 },
  ],
};

function generateWeeklyTasks(weakSkills, targetBand) {
  const dailyTasks = {};
  const dayNames = ["0", "1", "2", "3", "4", "5", "6"]; // Mon=0, Sun=6
  
  // Prioritize weak skills
  const skillPriority = weakSkills.length > 0 
    ? weakSkills.map(s => s.skill)
    : ["listening", "reading", "writing", "speaking", "vocabulary"];
  
  for (let day = 0; day < 7; day++) {
    dailyTasks[dayNames[day]] = [];
    
    // 2-3 tasks per day
    const tasksPerDay = day < 5 ? 3 : 2; // Fewer on weekends
    
    for (let i = 0; i < tasksPerDay; i++) {
      const skill = skillPriority[i % skillPriority.length];
      const templates = TASK_TEMPLATES[skill] || TASK_TEMPLATES.vocabulary;
      const template = templates[i % templates.length];
      
      dailyTasks[dayNames[day]].push({
        taskId: uuidv4(),
        skill,
        taskType: template.type,
        title: template.title,
        description: template.desc,
        duration: template.duration,
        difficulty: Math.min(targetBand, 8.0),
        isCompleted: false,
      });
    }
  }
  
  return dailyTasks;
}

function generateWeeklyGoals(weakSkills, targetBand) {
  const goals = [];
  const allSkills = ["listening", "reading", "writing", "speaking", "vocabulary"];
  
  for (const skill of allSkills) {
    const weakness = weakSkills.find(w => w.skill === skill);
    goals.push({
      skill,
      targetSessions: weakness ? 4 : 2, // More sessions for weak areas
      completedSessions: 0,
      focusAreas: weakness 
        ? getFocusAreas(skill, weakness.gap)
        : [],
    });
  }
  
  return goals;
}

function getFocusAreas(skill, gap) {
  const focusAreas = {
    listening: ["note-taking", "number/date recognition", "paraphrasing", "accent adaptation"],
    reading: ["skimming & scanning", "matching headings", "T/F/NG questions", "time management"],
    writing: ["task achievement", "coherence", "vocabulary range", "grammar accuracy"],
    speaking: ["fluency", "pronunciation", "vocabulary variety", "idea development"],
    vocabulary: ["academic words", "collocations", "synonyms", "contextual usage"],
  };
  
  // Return more focus areas for bigger gaps
  const count = gap >= 1.5 ? 3 : gap >= 1 ? 2 : 1;
  return (focusAreas[skill] || []).slice(0, count);
}

// ─── Generate AI-powered weekly focus ─────────────────────
async function generateAIFocus(scores, targetBand, weekNumber) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are an IELTS study coach. Generate a focused weekly plan.

Current Scores: Listening ${scores.listening}, Reading ${scores.reading}, Writing ${scores.writing}, Speaking ${scores.speaking}
Target Band: ${targetBand}
Week Number: ${weekNumber}

Return ONLY valid JSON (no markdown):
{
  "weeklyFocus": "<1-2 sentence focus for this week>",
  "recommendations": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "motivationalNote": "<brief encouragement>"
}`,
      }],
    });
    
    return JSON.parse(response.choices[0].message.content.replace(/```json|```/g, "").trim());
  } catch (err) {
    console.error("AI focus generation error:", err);
    return {
      weeklyFocus: "Focus on your weakest skills this week with consistent daily practice.",
      recommendations: [
        "Practice for at least 30 minutes daily",
        "Review mistakes from previous sessions",
        "Take note of new vocabulary",
      ],
      motivationalNote: "Consistency is key to improvement!",
    };
  }
}

// ─── ROUTE HANDLERS ───────────────────────────────────────

/**
 * GET /api/study-planner/plan
 * Get user's current study plan, create if doesn't exist
 */
exports.getPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    let plan = await StudyPlan.findOne({ userId });
    
    // If no plan exists, create one
    if (!plan) {
      // Get baseline results
      const baseline = await BaselineResult.findOne({ userId });
      if (!baseline) {
        return res.status(400).json({
          success: false,
          message: "Complete baseline test first to generate study plan",
        });
      }

      const scores = {
        listening: baseline.listening?.band || 5.0,
        reading: baseline.reading?.band || 5.0,
        writing: baseline.writing?.band || 5.0,
        speaking: baseline.speaking?.band || 5.0,
      };

      const targetBand = user.targetScore || 7.0;
      const weakSkills = identifyWeakSkills(scores, targetBand);
      
      // Generate AI recommendations
      const aiFocus = await generateAIFocus(scores, targetBand, 1);
      
      plan = await StudyPlan.create({
        userId,
        targetBand,
        baselineBand: baseline.overallBand,
        baselineScores: scores,
        weekNumber: 1,
        weekStartDate: getWeekStart(),
        dailyTasks: generateWeeklyTasks(weakSkills, targetBand),
        weeklyGoals: generateWeeklyGoals(weakSkills, targetBand),
        weeklyFocus: aiFocus.weeklyFocus,
        aiRecommendations: aiFocus.recommendations,
      });
    }

    // Check if we need to start a new week
    const currentWeekStart = getWeekStart();
    if (plan.weekStartDate < currentWeekStart) {
      // It's a new week - regenerate tasks
      const weakSkills = identifyWeakSkills(plan.baselineScores, plan.targetBand);
      const aiFocus = await generateAIFocus(plan.baselineScores, plan.targetBand, plan.weekNumber + 1);
      
      plan.weekNumber += 1;
      plan.weekStartDate = currentWeekStart;
      plan.dailyTasks = generateWeeklyTasks(weakSkills, plan.targetBand);
      plan.weeklyGoals = generateWeeklyGoals(weakSkills, plan.targetBand);
      plan.weeklyFocus = aiFocus.weeklyFocus;
      plan.aiRecommendations = aiFocus.recommendations;
      await plan.save();
    }

    // Calculate today's info
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1; // Convert Sun=0 to Mon=0
    const todaysTasks = plan.dailyTasks.get(String(dayIndex)) || [];
    
    // Calculate weekly progress
    let totalTasks = 0;
    let completedTasks = 0;
    for (const [_, tasks] of plan.dailyTasks) {
      totalTasks += tasks.length;
      completedTasks += tasks.filter(t => t.isCompleted).length;
    }

    res.json({
      success: true,
      plan: {
        _id: plan._id,
        targetBand: plan.targetBand,
        baselineBand: plan.baselineBand,
        currentBand: plan.baselineBand, // Will be updated with latest mock test
        weekNumber: plan.weekNumber,
        weekStartDate: plan.weekStartDate,
        weeklyFocus: plan.weeklyFocus,
        aiRecommendations: plan.aiRecommendations,
        dailyTasks: Object.fromEntries(plan.dailyTasks),
        weeklyGoals: plan.weeklyGoals,
        todaysTasks,
        progress: {
          completed: completedTasks,
          total: totalTasks,
          percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
        streak: plan.currentStreak,
        longestStreak: plan.longestStreak,
        totalMinutesPracticed: plan.totalMinutesPracticed,
      },
    });
  } catch (err) {
    console.error("getPlan error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/study-planner/task/complete
 * Mark a task as completed
 */
exports.completeTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId, sessionId } = req.body;

    const plan = await StudyPlan.findOne({ userId });
    if (!plan) {
      return res.status(404).json({ success: false, message: "No study plan found" });
    }

    // Find and update the task
    let taskFound = false;
    let completedTask = null;
    
    for (const [day, tasks] of plan.dailyTasks) {
      const task = tasks.find(t => t.taskId === taskId);
      if (task && !task.isCompleted) {
        task.isCompleted = true;
        task.completedAt = new Date();
        task.sessionId = sessionId;
        taskFound = true;
        completedTask = task;
        
        // Update weekly goal
        const goal = plan.weeklyGoals.find(g => g.skill === task.skill);
        if (goal) goal.completedSessions += 1;
        
        // Update totals
        plan.totalTasksCompleted += 1;
        plan.totalMinutesPracticed += task.duration;
        break;
      }
    }

    if (!taskFound) {
      return res.status(404).json({ success: false, message: "Task not found or already completed" });
    }

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivity = plan.lastActivityDate ? new Date(plan.lastActivityDate) : null;
    
    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        plan.currentStreak += 1;
      } else if (diffDays > 1) {
        plan.currentStreak = 1;
      }
    } else {
      plan.currentStreak = 1;
    }
    
    plan.longestStreak = Math.max(plan.longestStreak, plan.currentStreak);
    plan.lastActivityDate = new Date();
    
    await plan.save();

    res.json({
      success: true,
      message: "Task completed!",
      task: completedTask,
      streak: plan.currentStreak,
      totalCompleted: plan.totalTasksCompleted,
    });
  } catch (err) {
    console.error("completeTask error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/study-planner/progress
 * Get detailed progress analytics
 */
exports.getProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const plan = await StudyPlan.findOne({ userId });
    if (!plan) {
      return res.status(404).json({ success: false, message: "No study plan found" });
    }

    // Get latest listening progress for comparison
    const listeningProgress = await ListeningProgress.findOne({ userId });

    // Calculate skill-wise progress
    const skillProgress = {};
    for (const goal of plan.weeklyGoals) {
      skillProgress[goal.skill] = {
        targetSessions: goal.targetSessions,
        completedSessions: goal.completedSessions,
        percentage: goal.targetSessions > 0 
          ? Math.round((goal.completedSessions / goal.targetSessions) * 100)
          : 0,
        focusAreas: goal.focusAreas,
      };
    }

    // Weekly completion trend (from dailyTasks)
    const weeklyTrend = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      const tasks = plan.dailyTasks.get(String(i)) || [];
      weeklyTrend.push({
        day: dayNames[i],
        total: tasks.length,
        completed: tasks.filter(t => t.isCompleted).length,
      });
    }

    res.json({
      success: true,
      progress: {
        baselineBand: plan.baselineBand,
        targetBand: plan.targetBand,
        gapToBridge: Math.max(0, plan.targetBand - plan.baselineBand),
        weekNumber: plan.weekNumber,
        currentStreak: plan.currentStreak,
        longestStreak: plan.longestStreak,
        totalTasksCompleted: plan.totalTasksCompleted,
        totalMinutesPracticed: plan.totalMinutesPracticed,
        skillProgress,
        weeklyTrend,
        aiRecommendations: plan.aiRecommendations,
      },
    });
  } catch (err) {
    console.error("getProgress error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/study-planner/regenerate
 * Regenerate study plan (e.g., after mock test)
 */
exports.regeneratePlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const { newScores } = req.body; // Optional: updated scores from mock test

    const plan = await StudyPlan.findOne({ userId });
    if (!plan) {
      return res.status(404).json({ success: false, message: "No study plan found" });
    }

    // Update scores if provided
    if (newScores) {
      plan.baselineScores = { ...plan.baselineScores, ...newScores };
    }

    const weakSkills = identifyWeakSkills(plan.baselineScores, plan.targetBand);
    const aiFocus = await generateAIFocus(plan.baselineScores, plan.targetBand, plan.weekNumber);

    plan.dailyTasks = generateWeeklyTasks(weakSkills, plan.targetBand);
    plan.weeklyGoals = generateWeeklyGoals(weakSkills, plan.targetBand);
    plan.weeklyFocus = aiFocus.weeklyFocus;
    plan.aiRecommendations = aiFocus.recommendations;
    plan.weekStartDate = getWeekStart();
    
    await plan.save();

    res.json({
      success: true,
      message: "Study plan regenerated!",
      weeklyFocus: plan.weeklyFocus,
    });
  } catch (err) {
    console.error("regeneratePlan error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/study-planner/target
 * Update target band
 */
exports.updateTarget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetBand } = req.body;

    if (!targetBand || targetBand < 4 || targetBand > 9) {
      return res.status(400).json({ success: false, message: "Invalid target band (4-9)" });
    }

    const plan = await StudyPlan.findOne({ userId });
    if (!plan) {
      return res.status(404).json({ success: false, message: "No study plan found" });
    }

    plan.targetBand = targetBand;
    
    // Regenerate based on new target
    const weakSkills = identifyWeakSkills(plan.baselineScores, targetBand);
    const aiFocus = await generateAIFocus(plan.baselineScores, targetBand, plan.weekNumber);

    plan.dailyTasks = generateWeeklyTasks(weakSkills, targetBand);
    plan.weeklyGoals = generateWeeklyGoals(weakSkills, targetBand);
    plan.weeklyFocus = aiFocus.weeklyFocus;
    plan.aiRecommendations = aiFocus.recommendations;
    
    await plan.save();

    // Also update user's target
    await User.findByIdAndUpdate(userId, { targetScore: targetBand });

    res.json({
      success: true,
      message: "Target updated and plan regenerated!",
      targetBand,
    });
  } catch (err) {
    console.error("updateTarget error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Auto-complete a task by skill type when user finishes a practice session
 * Called internally from other controllers (reading, writing, etc.)
 * @param {ObjectId} userId - User ID
 * @param {string} skill - "listening" | "reading" | "writing" | "speaking" | "vocabulary"
 * @param {ObjectId} sessionId - Optional session ID reference
 * @returns {Object} { completed: boolean, task?: Object }
 */
exports.autoCompleteTaskBySkill = async (userId, skill, sessionId = null) => {
  try {
    const plan = await StudyPlan.findOne({ userId });
    if (!plan) return { completed: false };

    // Get today's day index (0=Mon, 1=Tue, ..., 6=Sun)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Sunday=6

    const todayTasks = plan.dailyTasks.get(String(dayIndex)) || [];
    
    // Find first incomplete task matching the skill
    const task = todayTasks.find(t => t.skill === skill && !t.isCompleted);
    if (!task) return { completed: false };

    // Mark task as completed
    task.isCompleted = true;
    task.completedAt = new Date();
    if (sessionId) task.sessionId = sessionId;

    // Update weekly goal
    const goal = plan.weeklyGoals.find(g => g.skill === skill);
    if (goal) goal.completedSessions += 1;

    // Update totals
    plan.totalTasksCompleted += 1;
    plan.totalMinutesPracticed += task.duration;

    // Update streak
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const lastActivity = plan.lastActivityDate ? new Date(plan.lastActivityDate) : null;

    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((todayStart - lastActivity) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        plan.currentStreak += 1;
      } else if (diffDays > 1) {
        plan.currentStreak = 1;
      }
    } else {
      plan.currentStreak = 1;
    }

    plan.longestStreak = Math.max(plan.longestStreak, plan.currentStreak);
    plan.lastActivityDate = new Date();

    await plan.save();

    return { completed: true, task };
  } catch (err) {
    console.error("autoCompleteTaskBySkill error:", err);
    return { completed: false, error: err.message };
  }
};
