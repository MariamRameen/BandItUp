const OpenAI = require("openai");
const MockTestResult = require("../models/MockTestResult");
const BaselineResult = require("../models/BaselineResult");
const User = require("../models/User");
const StudyPlan = require("../models/StudyPlan");
const Roadmap = require("../models/Roadmap");
const ListeningSession = require("../models/ListeningSession");
const ReadingSession = require("../models/ReadingSession");
const WritingSession = require("../models/WritingSession");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helper Functions ─────────────────────────────────────

function roundHalf(n) {
  return Math.round(n * 2) / 2;
}

function bandToLabel(b) {
  if (b >= 8.5) return "Expert";
  if (b >= 7.5) return "Very Good";
  if (b >= 6.5) return "Competent";
  if (b >= 5.5) return "Modest";
  if (b >= 4.5) return "Limited";
  return "Beginner";
}

async function getAdaptiveDifficulty(userId) {
  // Get recent session performances
  const [listeningProgress, readingSessions, writingSessions] = await Promise.all([
    ListeningSession.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ReadingSession.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    WritingSession.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  // Calculate average band per skill
  const calcAvg = (sessions) => {
    const bands = sessions.filter(s => s.bandScore).map(s => s.bandScore);
    return bands.length > 0 ? bands.reduce((a, b) => a + b, 0) / bands.length : 5.5;
  };

  return {
    listening: roundHalf(calcAvg(listeningProgress)),
    reading: roundHalf(calcAvg(readingSessions)),
    writing: roundHalf(calcAvg(writingSessions)),
    speaking: 5.5, // Default since speaking isn't fully implemented
  };
}

async function generateDiagnostic(scores, baselineScores) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `You are an IELTS expert. Generate a diagnostic report comparing mock test to baseline.

Mock Test Scores: Listening ${scores.listening}, Reading ${scores.reading}, Writing ${scores.writing}, Speaking ${scores.speaking}
Baseline Scores: Listening ${baselineScores.listening || 'N/A'}, Reading ${baselineScores.reading || 'N/A'}, Writing ${baselineScores.writing || 'N/A'}, Speaking ${baselineScores.speaking || 'N/A'}

Return ONLY valid JSON:
{
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "advice": ["<specific tip 1>", "<specific tip 2>", "<specific tip 3>"],
  "focusAreas": ["<skill to focus on>", "<question type to practice>"]
}`,
      }],
    });
    
    return JSON.parse(response.choices[0].message.content.replace(/```json|```/g, "").trim());
  } catch (err) {
    console.error("Diagnostic generation error:", err);
    return {
      strengths: ["Completed the mock test successfully"],
      weaknesses: ["Some areas need improvement"],
      advice: ["Continue practicing daily", "Focus on your weakest skill"],
      focusAreas: ["All skills"],
    };
  }
}

/**
 * Update Study Plan and Roadmap based on mock test results
 * This implements adaptive learning by:
 * 1. Updating current skill scores
 * 2. Regenerating weekly tasks focusing on weak areas
 * 3. Adjusting task difficulties
 * 4. Updating roadmap progress
 * 5. Calculating estimated time to target
 */
async function updateStudyPlanFromMock(userId, mockScores, diagnosticReport) {
  try {
    const studyPlan = await StudyPlan.findOne({ userId });
    const roadmap = await Roadmap.findOne({ userId });
    const user = await User.findById(userId);
    
    if (!studyPlan) return { planUpdated: false };

    // 1. Update current skill scores
    studyPlan.baselineScores = {
      listening: mockScores.listening || studyPlan.baselineScores?.listening,
      reading: mockScores.reading || studyPlan.baselineScores?.reading,
      writing: mockScores.writing || studyPlan.baselineScores?.writing,
      speaking: mockScores.speaking || studyPlan.baselineScores?.speaking,
    };

    // 2. Calculate overall current band
    const currentScores = Object.values(studyPlan.baselineScores).filter(s => s > 0);
    const avgCurrentBand = currentScores.length > 0
      ? roundHalf(currentScores.reduce((a, b) => a + b, 0) / currentScores.length)
      : studyPlan.baselineBand;

    // 3. Identify weak skills (below target or below average)
    const targetBand = studyPlan.targetBand || user?.targetScore || 7.0;
    const weakSkills = [];
    const skillGaps = {};

    for (const [skill, score] of Object.entries(studyPlan.baselineScores)) {
      if (score && score < targetBand) {
        const gap = targetBand - score;
        skillGaps[skill] = gap;
        if (gap > 0.5) weakSkills.push(skill);
      }
    }

    // Sort weak skills by gap (largest gap first = priority)
    weakSkills.sort((a, b) => (skillGaps[b] || 0) - (skillGaps[a] || 0));

    // 4. Regenerate weekly tasks based on weaknesses
    const newDailyTasks = generateAdaptiveTasks(weakSkills, skillGaps, targetBand, diagnosticReport);
    studyPlan.dailyTasks = newDailyTasks;

    // 5. Update weekly goals
    studyPlan.weeklyGoals = generateWeeklyGoals(weakSkills, targetBand);

    // 6. Generate AI focus recommendation
    studyPlan.weeklyFocus = generateWeeklyFocus(weakSkills, avgCurrentBand, targetBand);
    studyPlan.aiRecommendations = diagnosticReport?.advice || [];

    // 7. Increment week if needed
    const now = new Date();
    const weekStart = new Date(studyPlan.weekStartDate);
    const daysSinceStart = Math.floor((now - weekStart) / (1000 * 60 * 60 * 24));
    if (daysSinceStart >= 7) {
      studyPlan.weekNumber += 1;
      studyPlan.weekStartDate = now;
    }

    await studyPlan.save();

    // 8. Update roadmap progress
    if (roadmap) {
      roadmap.currentBand = avgCurrentBand;
      roadmap.bandImprovement = roundHalf(avgCurrentBand - roadmap.baselineBand);
      
      // Calculate progress percentage
      const totalGap = roadmap.targetBand - roadmap.baselineBand;
      const currentGap = roadmap.targetBand - avgCurrentBand;
      if (totalGap > 0) {
        roadmap.progressPercentage = Math.min(100, Math.max(0, Math.round((1 - currentGap / totalGap) * 100)));
      }

      // Update milestone completion status
      if (roadmap.milestones && roadmap.milestones.length > 0) {
        for (const milestone of roadmap.milestones) {
          if (avgCurrentBand >= milestone.targetOverall && !milestone.achieved) {
            milestone.achieved = true;
            milestone.achievedAt = new Date();
          }
        }
      }

      // Recalculate estimated completion
      if (avgCurrentBand < roadmap.targetBand) {
        // Estimate weeks remaining based on current progress
        const weeksElapsed = roadmap.currentWeek || 1;
        const bandGained = avgCurrentBand - roadmap.baselineBand;
        const bandRemaining = roadmap.targetBand - avgCurrentBand;
        
        if (bandGained > 0) {
          const weeksPerBand = weeksElapsed / bandGained;
          const estimatedWeeksRemaining = Math.ceil(bandRemaining * weeksPerBand);
          roadmap.estimatedWeeks = weeksElapsed + estimatedWeeksRemaining;
        }
      }

      await roadmap.save();
    }

    return {
      planUpdated: true,
      currentBand: avgCurrentBand,
      weakSkills,
      newFocus: studyPlan.weeklyFocus,
      progressPercentage: roadmap?.progressPercentage,
    };
  } catch (err) {
    console.error("updateStudyPlanFromMock error:", err);
    return { planUpdated: false, error: err.message };
  }
}

/**
 * Generate adaptive daily tasks based on mock test weaknesses
 */
function generateAdaptiveTasks(weakSkills, skillGaps, targetBand, diagnosticReport) {
  const dailyTasks = new Map();
  const dayNames = ["0", "1", "2", "3", "4", "5", "6"]; // Mon-Sun
  
  const taskTemplates = {
    listening: [
      { taskType: "practice", title: "Listening Practice", description: "Complete a listening section", duration: 30 },
      { taskType: "review", title: "Review Listening Errors", description: "Analyze wrong answers", duration: 15 },
    ],
    reading: [
      { taskType: "practice", title: "Reading Practice", description: "Complete a reading passage", duration: 40 },
      { taskType: "review", title: "Vocabulary Review", description: "Learn academic words", duration: 20 },
    ],
    writing: [
      { taskType: "practice", title: "Essay Writing", description: "Write a Task 2 essay", duration: 45 },
      { taskType: "review", title: "Grammar Review", description: "Practice complex sentences", duration: 20 },
    ],
    speaking: [
      { taskType: "practice", title: "Speaking Practice", description: "Record Part 2 response", duration: 20 },
      { taskType: "review", title: "Fluency Drills", description: "Practice linking phrases", duration: 15 },
    ],
    vocabulary: [
      { taskType: "practice", title: "Vocabulary Quiz", description: "Test IELTS vocabulary", duration: 20 },
      { taskType: "review", title: "Word Review", description: "Review flashcards", duration: 15 },
    ],
  };

  // Distribute tasks across days, prioritizing weak skills
  for (let day = 0; day < 7; day++) {
    const tasks = [];
    let taskId = 1;

    // Add 2-3 tasks per day
    // Priority 1: Weakest skill
    if (weakSkills[0] && taskTemplates[weakSkills[0]]) {
      const template = taskTemplates[weakSkills[0]][day % 2]; // Alternate between practice and review
      tasks.push({
        taskId: `d${day}t${taskId++}`,
        skill: weakSkills[0],
        ...template,
        difficulty: targetBand,
        isCompleted: false,
      });
    }

    // Priority 2: Second weakest or vocabulary
    const secondSkill = weakSkills[1] || "vocabulary";
    if (taskTemplates[secondSkill]) {
      const template = taskTemplates[secondSkill][0];
      tasks.push({
        taskId: `d${day}t${taskId++}`,
        skill: secondSkill,
        ...template,
        difficulty: targetBand,
        isCompleted: false,
      });
    }

    // Add variety on some days
    if (day % 3 === 0 && weakSkills[2]) {
      const template = taskTemplates[weakSkills[2]]?.[0];
      if (template) {
        tasks.push({
          taskId: `d${day}t${taskId++}`,
          skill: weakSkills[2],
          ...template,
          difficulty: targetBand,
          isCompleted: false,
        });
      }
    }

    // Add diagnostic-recommended focus areas
    if (diagnosticReport?.focusAreas?.length > 0 && day % 2 === 0) {
      const focusArea = diagnosticReport.focusAreas[day % diagnosticReport.focusAreas.length];
      tasks.push({
        taskId: `d${day}t${taskId++}`,
        skill: "review",
        taskType: "focus",
        title: "Focus Area Practice",
        description: focusArea,
        duration: 20,
        difficulty: targetBand,
        isCompleted: false,
      });
    }

    dailyTasks.set(String(day), tasks);
  }

  return dailyTasks;
}

/**
 * Generate weekly goals for each skill
 */
function generateWeeklyGoals(weakSkills, targetBand) {
  const allSkills = ["listening", "reading", "writing", "speaking", "vocabulary"];
  
  return allSkills.map(skill => {
    const isWeak = weakSkills.includes(skill);
    return {
      skill,
      targetSessions: isWeak ? 5 : 3, // More sessions for weak skills
      completedSessions: 0,
      focusAreas: isWeak ? ["Practice under timed conditions", "Review wrong answers"] : [],
    };
  });
}

/**
 * Generate weekly focus message
 */
function generateWeeklyFocus(weakSkills, currentBand, targetBand) {
  if (weakSkills.length === 0) {
    return `Great progress! Keep practicing to maintain your ${currentBand} band score.`;
  }
  
  const gap = (targetBand - currentBand).toFixed(1);
  const primaryFocus = weakSkills[0]?.charAt(0).toUpperCase() + weakSkills[0]?.slice(1);
  
  return `Focus on ${primaryFocus} this week. You need ${gap} bands to reach your target. Practice daily!`;
}

// ─── ROUTE HANDLERS ───────────────────────────────────────

/**
 * GET /api/mock-tests
 * Get all mock tests for the user
 */
exports.getMockTests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const mockTests = await MockTestResult.find({ userId })
      .sort({ testNumber: -1 })
      .lean();
    
    // Get baseline for comparison
    const baseline = await BaselineResult.findOne({ userId }).lean();
    
    // Calculate stats
    const completed = mockTests.filter(t => t.status === "completed");
    const latestBand = completed[0]?.overallBand || baseline?.overallBand || 0;
    const baselineBand = baseline?.overallBand || 0;
    const improvement = latestBand - baselineBand;

    res.json({
      success: true,
      mockTests: mockTests.map(t => ({
        _id: t._id,
        testNumber: t.testNumber,
        testType: t.testType,
        status: t.status,
        scheduledFor: t.scheduledFor,
        completedAt: t.completedAt,
        overallBand: t.overallBand,
        skillLabel: t.skillLabel,
        listening: t.listening?.band,
        reading: t.reading?.band,
        writing: t.writing?.band,
        speaking: t.speaking?.band,
        improvementFromBaseline: t.improvementFromBaseline,
      })),
      stats: {
        total: mockTests.length,
        completed: completed.length,
        baselineBand,
        latestBand,
        improvement: improvement.toFixed(1),
      },
    });
  } catch (err) {
    console.error("getMockTests error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/mock-tests/schedule
 * Schedule a new mock test
 */
exports.scheduleMockTest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { testType = "full", scheduledFor } = req.body;
    
    // Get baseline
    const baseline = await BaselineResult.findOne({ userId });
    if (!baseline) {
      return res.status(400).json({
        success: false,
        message: "Complete baseline test before scheduling mock tests",
      });
    }

    // Get count for test number
    const count = await MockTestResult.countDocuments({ userId });
    
    // Get user for exam type
    const user = await User.findById(userId);
    
    // Get adaptive difficulty
    const difficulty = await getAdaptiveDifficulty(userId);
    const avgDifficulty = roundHalf(
      (difficulty.listening + difficulty.reading + difficulty.writing + difficulty.speaking) / 4
    );

    const mockTest = await MockTestResult.create({
      userId,
      testNumber: count + 1,
      testType,
      examType: user.examType || "Academic",
      difficulty: avgDifficulty,
      baselineBand: baseline.overallBand,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      status: "scheduled",
    });

    res.json({
      success: true,
      mockTest: {
        _id: mockTest._id,
        testNumber: mockTest.testNumber,
        testType: mockTest.testType,
        scheduledFor: mockTest.scheduledFor,
        status: mockTest.status,
      },
    });
  } catch (err) {
    console.error("scheduleMockTest error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/mock-tests/:id/start
 * Start a mock test
 */
exports.startMockTest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const mockTest = await MockTestResult.findOne({ _id: id, userId });
    if (!mockTest) {
      return res.status(404).json({ success: false, message: "Mock test not found" });
    }

    if (mockTest.status !== "scheduled") {
      return res.status(400).json({ success: false, message: "Mock test already started or completed" });
    }

    mockTest.status = "in-progress";
    mockTest.startedAt = new Date();
    await mockTest.save();

    res.json({
      success: true,
      mockTest: {
        _id: mockTest._id,
        testNumber: mockTest.testNumber,
        testType: mockTest.testType,
        status: mockTest.status,
        startedAt: mockTest.startedAt,
      },
    });
  } catch (err) {
    console.error("startMockTest error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/mock-tests/:id/complete
 * Complete a mock test with section scores
 */
exports.completeMockTest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { listening, reading, writing, speaking, timeUsed } = req.body;

    const mockTest = await MockTestResult.findOne({ _id: id, userId });
    if (!mockTest) {
      return res.status(404).json({ success: false, message: "Mock test not found" });
    }

    // Get previous mock for comparison
    const previousMock = await MockTestResult.findOne({
      userId,
      status: "completed",
      testNumber: { $lt: mockTest.testNumber },
    }).sort({ testNumber: -1 });

    // Update section scores
    if (listening) mockTest.listening = listening;
    if (reading) mockTest.reading = reading;
    if (writing) mockTest.writing = writing;
    if (speaking) mockTest.speaking = speaking;

    // Calculate overall band
    const sectionBands = [
      mockTest.listening?.band || 0,
      mockTest.reading?.band || 0,
      mockTest.writing?.band || 0,
      mockTest.speaking?.band || 0,
    ].filter(b => b > 0);
    
    mockTest.overallBand = sectionBands.length > 0
      ? roundHalf(sectionBands.reduce((a, b) => a + b, 0) / sectionBands.length)
      : 0;
    mockTest.skillLabel = bandToLabel(mockTest.overallBand);

    // Calculate improvements
    mockTest.improvementFromBaseline = roundHalf(mockTest.overallBand - (mockTest.baselineBand || 0));
    if (previousMock) {
      mockTest.previousMockBand = previousMock.overallBand;
      mockTest.improvementFromPrevious = roundHalf(mockTest.overallBand - previousMock.overallBand);
    }

    // Generate diagnostic
    const baseline = await BaselineResult.findOne({ userId });
    const baselineScores = baseline ? {
      listening: baseline.listening?.band,
      reading: baseline.reading?.band,
      writing: baseline.writing?.band,
      speaking: baseline.speaking?.band,
    } : {};
    
    mockTest.diagnosticReport = await generateDiagnostic(
      {
        listening: mockTest.listening?.band || 0,
        reading: mockTest.reading?.band || 0,
        writing: mockTest.writing?.band || 0,
        speaking: mockTest.speaking?.band || 0,
      },
      baselineScores
    );

    // Complete the test
    mockTest.status = "completed";
    mockTest.completedAt = new Date();
    mockTest.timeUsed = timeUsed || Math.round((new Date() - mockTest.startedAt) / 60000);
    
    await mockTest.save();

    // Update study plan and roadmap with adaptive learning
    const mockScores = {
      listening: mockTest.listening?.band || 0,
      reading: mockTest.reading?.band || 0,
      writing: mockTest.writing?.band || 0,
      speaking: mockTest.speaking?.band || 0,
    };
    
    const studyPlanUpdate = await updateStudyPlanFromMock(
      userId, 
      mockScores, 
      mockTest.diagnosticReport
    );

    res.json({
      success: true,
      result: {
        _id: mockTest._id,
        testNumber: mockTest.testNumber,
        overallBand: mockTest.overallBand,
        skillLabel: mockTest.skillLabel,
        listening: mockTest.listening,
        reading: mockTest.reading,
        writing: mockTest.writing,
        speaking: mockTest.speaking,
        improvementFromBaseline: mockTest.improvementFromBaseline,
        improvementFromPrevious: mockTest.improvementFromPrevious,
        diagnosticReport: mockTest.diagnosticReport,
        completedAt: mockTest.completedAt,
        // Include study plan update results
        studyPlanUpdated: studyPlanUpdate.planUpdated,
        currentBand: studyPlanUpdate.currentBand,
        weakSkills: studyPlanUpdate.weakSkills,
        newFocus: studyPlanUpdate.newFocus,
        progressPercentage: studyPlanUpdate.progressPercentage,
      },
    });
  } catch (err) {
    console.error("completeMockTest error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/mock-tests/:id
 * Get a specific mock test result
 */
exports.getMockTest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const mockTest = await MockTestResult.findOne({ _id: id, userId }).lean();
    if (!mockTest) {
      return res.status(404).json({ success: false, message: "Mock test not found" });
    }

    // Get baseline for comparison
    const baseline = await BaselineResult.findOne({ userId }).lean();

    res.json({
      success: true,
      mockTest,
      baseline: baseline ? {
        overallBand: baseline.overallBand,
        listening: baseline.listening?.band,
        reading: baseline.reading?.band,
        writing: baseline.writing?.band,
        speaking: baseline.speaking?.band,
      } : null,
    });
  } catch (err) {
    console.error("getMockTest error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/mock-tests/progress
 * Get mock test progression over time
 */
exports.getProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    const mockTests = await MockTestResult.find({ 
      userId, 
      status: "completed" 
    })
      .sort({ testNumber: 1 })
      .select("testNumber overallBand listening reading writing speaking completedAt")
      .lean();

    const baseline = await BaselineResult.findOne({ userId }).lean();

    // Build progression data
    const progression = [];
    
    if (baseline) {
      progression.push({
        label: "Baseline",
        date: baseline.createdAt,
        overall: baseline.overallBand,
        listening: baseline.listening?.band,
        reading: baseline.reading?.band,
        writing: baseline.writing?.band,
        speaking: baseline.speaking?.band,
      });
    }

    mockTests.forEach(test => {
      progression.push({
        label: `Mock ${test.testNumber}`,
        date: test.completedAt,
        overall: test.overallBand,
        listening: test.listening?.band,
        reading: test.reading?.band,
        writing: test.writing?.band,
        speaking: test.speaking?.band,
      });
    });

    // Calculate improvement trends
    const latestScores = progression[progression.length - 1] || {};
    const baselineScores = progression[0] || {};
    
    const improvement = {
      overall: (latestScores.overall || 0) - (baselineScores.overall || 0),
      listening: (latestScores.listening || 0) - (baselineScores.listening || 0),
      reading: (latestScores.reading || 0) - (baselineScores.reading || 0),
      writing: (latestScores.writing || 0) - (baselineScores.writing || 0),
      speaking: (latestScores.speaking || 0) - (baselineScores.speaking || 0),
    };

    res.json({
      success: true,
      progression,
      improvement,
      testsCompleted: mockTests.length,
    });
  } catch (err) {
    console.error("getProgress error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/mock-tests/quick
 * Create and start a mock test immediately
 */
exports.quickMockTest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { testType = "full" } = req.body;

    // Get baseline
    const baseline = await BaselineResult.findOne({ userId });
    if (!baseline) {
      return res.status(400).json({
        success: false,
        message: "Complete baseline test first",
      });
    }

    const user = await User.findById(userId);
    const count = await MockTestResult.countDocuments({ userId });

    const mockTest = await MockTestResult.create({
      userId,
      testNumber: count + 1,
      testType,
      examType: user.examType || "Academic",
      difficulty: baseline.overallBand,
      baselineBand: baseline.overallBand,
      scheduledFor: new Date(),
      startedAt: new Date(),
      status: "in-progress",
    });

    res.json({
      success: true,
      mockTest: {
        _id: mockTest._id,
        testNumber: mockTest.testNumber,
        testType: mockTest.testType,
        status: mockTest.status,
      },
    });
  } catch (err) {
    console.error("quickMockTest error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/mock-tests/:id/section
 * Update a specific section result (for modular completion)
 */
exports.updateSection = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { section, band, rawScore, maxScore, feedback, sessionId } = req.body;

    if (!["listening", "reading", "writing", "speaking"].includes(section)) {
      return res.status(400).json({ success: false, message: "Invalid section" });
    }

    const mockTest = await MockTestResult.findOne({ _id: id, userId });
    if (!mockTest) {
      return res.status(404).json({ success: false, message: "Mock test not found" });
    }

    // Update section
    mockTest[section] = {
      band: roundHalf(band),
      rawScore,
      maxScore,
      feedback,
    };

    // Store session reference
    if (sessionId) {
      mockTest[`${section}SessionId`] = sessionId;
    }

    await mockTest.save();

    res.json({
      success: true,
      section: mockTest[section],
    });
  } catch (err) {
    console.error("updateSection error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
