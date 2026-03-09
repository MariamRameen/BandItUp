const OpenAI = require("openai");
const Roadmap = require("../models/Roadmap");
const BaselineResult = require("../models/BaselineResult");
const MockTestResult = require("../models/MockTestResult");
const User = require("../models/User");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helper: Generate AI-powered milestones ─────────────────────

async function generateAIMilestones(baselineBand, targetBand, skillScores) {
  const gap = targetBand - baselineBand;
  
  // Estimate weeks based on gap (approximately 4-6 weeks per 0.5 band improvement)
  const estimatedWeeks = Math.max(4, Math.ceil(gap * 10));
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are an IELTS study coach creating a roadmap to help a student improve.

Current Overall Band: ${baselineBand}
Target Band: ${targetBand}
Current Skill Scores:
- Listening: ${skillScores.listening || baselineBand}
- Reading: ${skillScores.reading || baselineBand}
- Writing: ${skillScores.writing || baselineBand}
- Speaking: ${skillScores.speaking || baselineBand}

Estimated duration: ${estimatedWeeks} weeks

Generate a realistic milestone-based roadmap with checkpoints every 2-3 weeks.
Each milestone should have incremental band targets and specific focus areas.

Return ONLY valid JSON (no markdown):
{
  "overallStrategy": "<1-2 sentence overall approach>",
  "keyRecommendations": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "estimatedStudyHoursPerWeek": <number 5-15>,
  "milestones": [
    {
      "weekNumber": <week number when this milestone should be reached>,
      "targetOverall": <target band for this milestone e.g., 6.5>,
      "skillTargets": {
        "listening": <target>,
        "reading": <target>,
        "writing": <target>,
        "speaking": <target>
      },
      "keyFocus": ["<area 1>", "<area 2>"],
      "tasks": ["<key task 1>", "<key task 2>"]
    }
  ]
}

Include 3-5 milestones leading to the target band.`,
      }],
    });
    
    const result = JSON.parse(response.choices[0].message.content.replace(/```json|```/g, "").trim());
    
    return {
      estimatedWeeks,
      ...result,
    };
  } catch (err) {
    console.error("AI milestone generation error:", err);
    
    // Fallback: Generate basic milestones without AI
    return generateBasicMilestones(baselineBand, targetBand, estimatedWeeks);
  }
}

function generateBasicMilestones(baselineBand, targetBand, estimatedWeeks) {
  const gap = targetBand - baselineBand;
  const numMilestones = Math.min(5, Math.ceil(gap * 2));
  const milestones = [];
  
  const bandIncrement = gap / numMilestones;
  const weekIncrement = Math.floor(estimatedWeeks / numMilestones);
  
  for (let i = 1; i <= numMilestones; i++) {
    const targetForMilestone = parseFloat((baselineBand + (bandIncrement * i)).toFixed(1));
    milestones.push({
      weekNumber: weekIncrement * i,
      targetOverall: Math.min(targetForMilestone, targetBand),
      skillTargets: {
        listening: targetForMilestone,
        reading: targetForMilestone,
        writing: targetForMilestone,
        speaking: targetForMilestone,
      },
      keyFocus: getFocusForBand(targetForMilestone),
      tasks: getTasksForBand(targetForMilestone),
    });
  }
  
  return {
    estimatedWeeks,
    overallStrategy: `Build from ${baselineBand} to ${targetBand} through consistent daily practice focusing on weak areas.`,
    keyRecommendations: [
      "Practice at least 30 minutes daily",
      "Take weekly mock tests to track progress",
      "Focus on your weakest skill each week",
    ],
    estimatedStudyHoursPerWeek: 10,
    milestones,
  };
}

function getFocusForBand(band) {
  if (band <= 5.5) return ["Basic grammar", "Core vocabulary", "Question type familiarity"];
  if (band <= 6.5) return ["Accuracy improvement", "Time management", "Paraphrasing skills"];
  if (band <= 7.5) return ["Complex sentences", "Academic vocabulary", "Coherence & cohesion"];
  return ["Native-like fluency", "Idiomatic expressions", "Error-free writing"];
}

function getTasksForBand(band) {
  if (band <= 5.5) return ["Complete basic exercises", "Learn 50 new words weekly"];
  if (band <= 6.5) return ["Timed practice sessions", "Essay structure mastery"];
  if (band <= 7.5) return ["Mock tests under exam conditions", "Detailed feedback review"];
  return ["Perfect weak areas", "Maintain consistency"];
}

// ─── ROUTE HANDLERS ───────────────────────────────────────

/**
 * GET /api/roadmap
 * Get user's current roadmap
 */
exports.getRoadmap = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let roadmap = await Roadmap.findOne({ userId });
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "No roadmap found. Generate one first.",
        needsGeneration: true,
      });
    }
    
    // Update current week and progress
    roadmap.updateCurrentWeek();
    roadmap.calculateProgress();
    await roadmap.save();
    
    // Get latest mock test to update current band
    const latestMock = await MockTestResult.findOne({
      userId,
      status: "completed",
    }).sort({ completedAt: -1 });
    
    if (latestMock && latestMock.overallBand !== roadmap.currentBand) {
      roadmap.currentBand = latestMock.overallBand;
      roadmap.calculateProgress();
      await roadmap.save();
    }
    
    res.json({
      success: true,
      roadmap: {
        _id: roadmap._id,
        baselineBand: roadmap.baselineBand,
        currentBand: roadmap.currentBand,
        targetBand: roadmap.targetBand,
        estimatedWeeks: roadmap.estimatedWeeks,
        currentWeek: roadmap.currentWeek,
        startDate: roadmap.startDate,
        estimatedEndDate: roadmap.estimatedEndDate,
        progressPercentage: roadmap.progressPercentage,
        bandImprovement: roadmap.bandImprovement,
        milestones: roadmap.milestones,
        overallStrategy: roadmap.overallStrategy,
        keyRecommendations: roadmap.keyRecommendations,
        estimatedStudyHoursPerWeek: roadmap.estimatedStudyHoursPerWeek,
        status: roadmap.status,
      },
    });
  } catch (err) {
    console.error("getRoadmap error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/roadmap/generate
 * Generate or regenerate user's roadmap
 */
exports.generateRoadmap = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetBand: requestedTarget } = req.body;
    
    // Get baseline result
    const baseline = await BaselineResult.findOne({ userId });
    if (!baseline) {
      return res.status(400).json({
        success: false,
        message: "Complete baseline test first to generate roadmap",
      });
    }
    
    // Get user's target or use requested
    const user = await User.findById(userId);
    const targetBand = requestedTarget || user.targetScore || 7.0;
    
    // Get latest mock test for current band
    const latestMock = await MockTestResult.findOne({
      userId,
      status: "completed",
    }).sort({ completedAt: -1 });
    
    const currentBand = latestMock?.overallBand || baseline.overallBand;
    
    const skillScores = {
      listening: baseline.skillScores?.listening || baseline.overallBand,
      reading: baseline.skillScores?.reading || baseline.overallBand,
      writing: baseline.skillScores?.writing || baseline.overallBand,
      speaking: baseline.skillScores?.speaking || baseline.overallBand,
    };
    
    // Generate AI milestones
    const aiResult = await generateAIMilestones(baseline.overallBand, targetBand, skillScores);
    
    // Calculate estimated end date
    const estimatedEndDate = new Date();
    estimatedEndDate.setDate(estimatedEndDate.getDate() + (aiResult.estimatedWeeks * 7));
    
    // Check if roadmap exists
    let roadmap = await Roadmap.findOne({ userId });
    
    if (roadmap) {
      // Track revision
      roadmap.revisionHistory.push({
        revisedAt: new Date(),
        reason: "Regenerated",
        previousTarget: roadmap.targetBand,
        newTarget: targetBand,
      });
      
      roadmap.baselineBand = baseline.overallBand;
      roadmap.currentBand = currentBand;
      roadmap.targetBand = targetBand;
      roadmap.estimatedWeeks = aiResult.estimatedWeeks;
      roadmap.estimatedEndDate = estimatedEndDate;
      roadmap.milestones = aiResult.milestones;
      roadmap.overallStrategy = aiResult.overallStrategy;
      roadmap.keyRecommendations = aiResult.keyRecommendations;
      roadmap.estimatedStudyHoursPerWeek = aiResult.estimatedStudyHoursPerWeek;
      roadmap.status = "active";
    } else {
      roadmap = new Roadmap({
        userId,
        baselineBand: baseline.overallBand,
        currentBand,
        targetBand,
        estimatedWeeks: aiResult.estimatedWeeks,
        startDate: new Date(),
        estimatedEndDate,
        milestones: aiResult.milestones,
        overallStrategy: aiResult.overallStrategy,
        keyRecommendations: aiResult.keyRecommendations,
        estimatedStudyHoursPerWeek: aiResult.estimatedStudyHoursPerWeek,
      });
    }
    
    roadmap.calculateProgress();
    await roadmap.save();
    
    // Update user's target score if different
    if (user.targetScore !== targetBand) {
      user.targetScore = targetBand;
      await user.save();
    }
    
    res.json({
      success: true,
      message: "Roadmap generated successfully!",
      roadmap: {
        _id: roadmap._id,
        baselineBand: roadmap.baselineBand,
        currentBand: roadmap.currentBand,
        targetBand: roadmap.targetBand,
        estimatedWeeks: roadmap.estimatedWeeks,
        currentWeek: roadmap.currentWeek,
        startDate: roadmap.startDate,
        estimatedEndDate: roadmap.estimatedEndDate,
        progressPercentage: roadmap.progressPercentage,
        milestones: roadmap.milestones,
        overallStrategy: roadmap.overallStrategy,
        keyRecommendations: roadmap.keyRecommendations,
      },
    });
  } catch (err) {
    console.error("generateRoadmap error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/roadmap/milestone/:milestoneId
 * Update a milestone (mark complete, update actual band)
 */
exports.updateMilestone = async (req, res) => {
  try {
    const userId = req.user._id;
    const { milestoneId } = req.params;
    const { actualBand, mockTestId, isCompleted } = req.body;
    
    const roadmap = await Roadmap.findOne({ userId });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: "Roadmap not found" });
    }
    
    const milestone = roadmap.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }
    
    if (actualBand !== undefined) milestone.actualBand = actualBand;
    if (mockTestId) milestone.mockTestId = mockTestId;
    if (isCompleted !== undefined) {
      milestone.isCompleted = isCompleted;
      if (isCompleted) milestone.completedAt = new Date();
    }
    
    // Update current band if actualBand provided
    if (actualBand && actualBand > roadmap.currentBand) {
      roadmap.currentBand = actualBand;
    }
    
    roadmap.calculateProgress();
    
    // Check if target reached
    if (roadmap.currentBand >= roadmap.targetBand) {
      roadmap.status = "completed";
    }
    
    await roadmap.save();
    
    res.json({
      success: true,
      message: "Milestone updated",
      milestone,
      roadmapProgress: roadmap.progressPercentage,
      status: roadmap.status,
    });
  } catch (err) {
    console.error("updateMilestone error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/roadmap/target
 * Update target band and regenerate roadmap
 */
exports.updateTarget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetBand } = req.body;
    
    if (!targetBand || targetBand < 4 || targetBand > 9) {
      return res.status(400).json({ success: false, message: "Invalid target band (4-9)" });
    }
    
    // Use generate endpoint with new target
    req.body.targetBand = targetBand;
    return exports.generateRoadmap(req, res);
  } catch (err) {
    console.error("updateTarget error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
