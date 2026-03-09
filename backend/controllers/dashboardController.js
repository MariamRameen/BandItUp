const BaselineResult = require("../models/BaselineResult");
const MockTestResult = require("../models/MockTestResult");
const StudyPlan = require("../models/StudyPlan");

// GET /api/dashboard - Get aggregated dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get baseline result
    const baseline = await BaselineResult.findOne({ userId });
    if (!baseline) {
      return res.status(400).json({
        success: false,
        message: "Please complete the baseline test first",
      });
    }

    // Get all mock test results
    const mockTests = await MockTestResult.find({
      userId,
      status: "completed",
    }).sort({ completedAt: 1 });

    // Get study plan
    const studyPlan = await StudyPlan.findOne({ userId });

    // Calculate current scores as AVERAGE of all mock tests (not just latest)
    // If no mock tests, use baseline scores
    const calculateAverageScores = () => {
      if (mockTests.length === 0) {
        return {
          overall: baseline.overallBand,
          listening: baseline.listening?.band || 0,
          reading: baseline.reading?.band || 0,
          writing: baseline.writing?.band || 0,
          speaking: baseline.speaking?.band || 0,
        };
      }

      // Calculate average of all completed mock tests
      const sum = {
        overall: 0,
        listening: 0,
        reading: 0,
        writing: 0,
        speaking: 0,
      };
      
      let counts = {
        overall: 0,
        listening: 0,
        reading: 0,
        writing: 0,
        speaking: 0,
      };

      mockTests.forEach(test => {
        if (test.overallBand) { sum.overall += test.overallBand; counts.overall++; }
        if (test.listening?.band) { sum.listening += test.listening.band; counts.listening++; }
        if (test.reading?.band) { sum.reading += test.reading.band; counts.reading++; }
        if (test.writing?.band) { sum.writing += test.writing.band; counts.writing++; }
        if (test.speaking?.band) { sum.speaking += test.speaking.band; counts.speaking++; }
      });

      // Round to nearest 0.5
      const roundHalf = n => Math.round(n * 2) / 2;

      return {
        overall: counts.overall > 0 ? roundHalf(sum.overall / counts.overall) : baseline.overallBand,
        listening: counts.listening > 0 ? roundHalf(sum.listening / counts.listening) : baseline.listening?.band || 0,
        reading: counts.reading > 0 ? roundHalf(sum.reading / counts.reading) : baseline.reading?.band || 0,
        writing: counts.writing > 0 ? roundHalf(sum.writing / counts.writing) : baseline.writing?.band || 0,
        speaking: counts.speaking > 0 ? roundHalf(sum.speaking / counts.speaking) : baseline.speaking?.band || 0,
      };
    };

    const currentScores = calculateAverageScores();
    const latestTest = mockTests.length > 0 ? mockTests[mockTests.length - 1] : null;

    const baselineScores = {
      overall: baseline.overallBand,
      listening: baseline.listening?.band,
      reading: baseline.reading?.band,
      writing: baseline.writing?.band,
      speaking: baseline.speaking?.band,
    };

    // Calculate improvement
    const improvement = {
      overall: parseFloat((currentScores.overall - baselineScores.overall).toFixed(1)),
      listening: parseFloat((currentScores.listening - baselineScores.listening).toFixed(1)),
      reading: parseFloat((currentScores.reading - baselineScores.reading).toFixed(1)),
      writing: parseFloat((currentScores.writing - baselineScores.writing).toFixed(1)),
      speaking: parseFloat((currentScores.speaking - baselineScores.speaking).toFixed(1)),
    };

    // Build trajectory data (weekly progression)
    const trajectoryData = [
      { week: "Baseline", score: baselineScores.overall },
      ...mockTests.map((test, idx) => ({
        week: `Test ${idx + 1}`,
        score: test.overallBand,
      })),
    ];

    // Performance comparison data
    const performanceData = [
      { skill: "Listening", baseline: baselineScores.listening, current: currentScores.listening },
      { skill: "Reading", baseline: baselineScores.reading, current: currentScores.reading },
      { skill: "Writing", baseline: baselineScores.writing, current: currentScores.writing },
      { skill: "Speaking", baseline: baselineScores.speaking, current: currentScores.speaking },
    ];

    // Get target score from user
    const targetScore = req.user.targetScore || 7.0;

    // Calculate progress percentage
    const startScore = baselineScores.overall;
    const progressRange = targetScore - startScore;
    const currentProgress = currentScores.overall - startScore;
    const progressPercentage = progressRange > 0 
      ? Math.min(100, Math.round((currentProgress / progressRange) * 100))
      : currentScores.overall >= targetScore ? 100 : 0;

    // Get strengths and weaknesses from latest diagnostic report or derive from scores
    let strengths = [];
    let weaknesses = [];

    if (latestTest?.diagnosticReport) {
      strengths = latestTest.diagnosticReport.strengths || [];
      weaknesses = latestTest.diagnosticReport.weaknesses || [];
    } else {
      // Derive from baseline
      const skillLabels = {
        listening: "Listening",
        reading: "Reading",
        writing: "Writing",
        speaking: "Speaking",
      };

      const skills = Object.entries(baselineScores)
        .filter(([key]) => key !== "overall")
        .map(([skill, score]) => ({ skill, score }))
        .sort((a, b) => b.score - a.score);

      strengths = skills.slice(0, 2).map(s => `${skillLabels[s.skill]} - Strong foundation`);
      weaknesses = skills.slice(-2).map(s => `${skillLabels[s.skill]} - Needs improvement`);
    }

    // Get weekly focus from study plan
    const weeklyFocus = studyPlan?.aiRecommendations || [];

    // Get study stats - dailyTasks is a Map, need to extract values first
    let tasksCompletedThisWeek = 0;
    if (studyPlan?.dailyTasks) {
      // dailyTasks is a Map where values are arrays of tasks
      const allTasks = Array.from(studyPlan.dailyTasks.values()).flat();
      tasksCompletedThisWeek = allTasks.filter(t => t?.isCompleted).length;
    }
    
    const studyStats = {
      streak: studyPlan?.streak || studyPlan?.currentStreak || 0,
      tasksCompletedThisWeek,
      totalMockTests: mockTests.length,
    };

    res.json({
      success: true,
      dashboard: {
        currentScores,
        baselineScores,
        improvement,
        targetScore,
        progressPercentage,
        trajectoryData,
        performanceData,
        strengths,
        weaknesses,
        weeklyFocus,
        studyStats,
        lastMockTest: latestTest ? {
          _id: latestTest._id,
          testNumber: latestTest.testNumber,
          completedAt: latestTest.completedAt,
          overallBand: latestTest.overallBand,
        } : null,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
