/**
 * Writing Controller - Handles all Writing module API endpoints
 */

const WritingSession = require('../models/WritingSession');
const aiService = require('../services/aiService');
const { autoCompleteTaskBySkill } = require('./studyPlannerController');

/**
 * Generate a new writing task
 * POST /api/writing/generate-task
 */
const generateTask = async (req, res) => {
  try {
    const { taskType, examType, options = {} } = req.body;

    // Validate required fields
    if (!taskType || ![1, 2].includes(taskType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid taskType. Must be 1 or 2.',
      });
    }

    if (!examType || !['Academic', 'General'].includes(examType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid examType. Must be Academic or General.',
      });
    }

    // Generate task using AI service
    const result = await aiService.generateWritingTask({
      taskType,
      examType,
      options,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate task',
        details: result.error,
      });
    }

    res.json({
      success: true,
      task: result.task,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Generate task error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating task',
    });
  }
};

/**
 * Start a new writing session (save draft)
 * POST /api/writing/sessions
 */
const createSession = async (req, res) => {
  try {
    const { taskType, examType, task, essay = '' } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!taskType || ![1, 2].includes(taskType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid taskType. Must be 1 or 2.',
      });
    }

    if (!examType || !['Academic', 'General'].includes(examType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid examType. Must be Academic or General.',
      });
    }

    if (!task || !task.prompt) {
      return res.status(400).json({
        success: false,
        error: 'Task with prompt is required.',
      });
    }

    // Set time limit based on task type (Task 1: 20min, Task 2: 40min)
    const timeLimit = taskType === 1 ? 1200 : 2400;

    // Create new session
    const session = new WritingSession({
      userId,
      taskType,
      examType,
      task,
      essay,
      wordCount: essay ? essay.trim().split(/\s+/).filter(Boolean).length : 0,
      timeLimit,
      status: 'draft',
    });

    await session.save();

    res.status(201).json({
      success: true,
      session: {
        id: session._id,
        taskType: session.taskType,
        examType: session.examType,
        task: session.task,
        essay: session.essay,
        wordCount: session.wordCount,
        timeLimit: session.timeLimit,
        status: session.status,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating session',
    });
  }
};

/**
 * Update a writing session (save draft)
 * PUT /api/writing/sessions/:sessionId
 */
const updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { essay, timeSpent } = req.body;
    const userId = req.user.id;

    const session = await WritingSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    if (session.status === 'evaluated') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update an already evaluated session',
      });
    }

    // Update fields
    if (essay !== undefined) {
      session.essay = essay;
      session.wordCount = essay.trim().split(/\s+/).filter(Boolean).length;
    }

    if (timeSpent !== undefined) {
      session.timeSpent = timeSpent;
    }

    await session.save();

    res.json({
      success: true,
      session: {
        id: session._id,
        essay: session.essay,
        wordCount: session.wordCount,
        timeSpent: session.timeSpent,
        status: session.status,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating session',
    });
  }
};

/**
 * Submit essay for evaluation
 * POST /api/writing/sessions/:sessionId/submit
 */
const submitForEvaluation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { essay, timeSpent } = req.body;
    const userId = req.user.id;

    const session = await WritingSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    if (session.status === 'evaluated') {
      return res.status(400).json({
        success: false,
        error: 'Session already evaluated',
      });
    }

    // Update essay if provided
    const finalEssay = essay || session.essay;

    if (!finalEssay || finalEssay.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Essay must be at least 50 characters',
      });
    }

    session.essay = finalEssay;
    session.wordCount = finalEssay.trim().split(/\s+/).filter(Boolean).length;
    session.status = 'submitted';

    if (timeSpent !== undefined) {
      session.timeSpent = timeSpent;
    }

    // Evaluate using AI service
    const evaluationResult = await aiService.evaluateWriting({
      taskType: session.taskType,
      examType: session.examType,
      taskPrompt: session.task.prompt,
      essay: session.essay,
      metadata: {
        essayType: session.task.essayType,
        letterType: session.task.letterType,
        visualDescription: session.task.visualDescription,
      },
    });

    if (!evaluationResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to evaluate essay',
        details: evaluationResult.error,
      });
    }

    const { evaluation } = evaluationResult;

    // Map evaluation to session schema
    session.evaluation = {
      overallBand: evaluation.overallBand,
      taskResponse: evaluation.criteria.taskResponse || evaluation.criteria.taskAchievement,
      coherenceCohesion: evaluation.criteria.coherenceCohesion,
      lexicalResource: evaluation.criteria.lexicalResource,
      grammaticalRange: evaluation.criteria.grammaticalRange,
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
    };

    // Map grammar errors
    session.grammarErrors = (evaluation.grammarErrors || []).map((err) => ({
      original: err.original,
      correction: err.correction,
      explanation: err.explanation,
      errorType: err.errorType || 'general',
    }));

    // Map vocabulary suggestions
    session.vocabularySuggestions = (evaluation.vocabularySuggestions || []).map((sug) => ({
      original: sug.original,
      upgrade: sug.upgrade,
      context: sug.context,
    }));

    session.status = 'evaluated';
    session.aiUsage = evaluationResult.usage;
    session.evaluatedAt = new Date();

    await session.save();

    // Auto-complete study plan task for writing
    await autoCompleteTaskBySkill(userId, "writing", session._id);

    res.json({
      success: true,
      session: {
        id: session._id,
        taskType: session.taskType,
        examType: session.examType,
        task: session.task,
        essay: session.essay,
        wordCount: session.wordCount,
        timeSpent: session.timeSpent,
        evaluation: session.evaluation,
        grammarErrors: session.grammarErrors,
        vocabularySuggestions: session.vocabularySuggestions,
        status: session.status,
        evaluatedAt: session.evaluatedAt,
      },
    });
  } catch (error) {
    console.error('Submit for evaluation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error evaluating essay',
    });
  }
};

/**
 * Get a specific writing session
 * GET /api/writing/sessions/:sessionId
 */
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await WritingSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching session',
    });
  }
};

/**
 * Get all writing sessions for current user
 * GET /api/writing/sessions
 */
const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, taskType, examType, limit = 20, page = 1 } = req.query;

    // Build query
    const query = { userId };

    if (status) {
      query.status = status;
    }

    if (taskType) {
      query.taskType = parseInt(taskType);
    }

    if (examType) {
      query.examType = examType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sessions, total] = await Promise.all([
      WritingSession.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-grammarErrors -vocabularySuggestions'), // Exclude large arrays for list view
      WritingSession.countDocuments(query),
    ]);

    res.json({
      success: true,
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching sessions',
    });
  }
};

/**
 * Get writing statistics for current user
 * GET /api/writing/stats
 */
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await WritingSession.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId), status: 'evaluated' } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgOverallBand: { $avg: '$evaluation.overallBand' },
          avgTaskResponse: { $avg: '$evaluation.taskResponse.band' },
          avgCoherenceCohesion: { $avg: '$evaluation.coherenceCohesion.band' },
          avgLexicalResource: { $avg: '$evaluation.lexicalResource.band' },
          avgGrammaticalRange: { $avg: '$evaluation.grammaticalRange.band' },
          totalTimeSpent: { $sum: '$timeSpent' },
          avgWordCount: { $avg: '$wordCount' },
          task1Count: {
            $sum: { $cond: [{ $eq: ['$taskType', 1] }, 1, 0] },
          },
          task2Count: {
            $sum: { $cond: [{ $eq: ['$taskType', 2] }, 1, 0] },
          },
        },
      },
    ]);

    // Get recent progress (last 10 evaluated sessions)
    const recentSessions = await WritingSession.find({
      userId,
      status: 'evaluated',
    })
      .sort({ evaluatedAt: -1 })
      .limit(10)
      .select('evaluatedAt evaluation.overallBand taskType');

    const defaultStats = {
      totalSessions: 0,
      avgOverallBand: 0,
      avgTaskResponse: 0,
      avgCoherenceCohesion: 0,
      avgLexicalResource: 0,
      avgGrammaticalRange: 0,
      totalTimeSpent: 0,
      avgWordCount: 0,
      task1Count: 0,
      task2Count: 0,
    };

    res.json({
      success: true,
      stats: stats[0] || defaultStats,
      recentProgress: recentSessions.map((s) => ({
        date: s.evaluatedAt,
        band: s.evaluation.overallBand,
        taskType: s.taskType,
      })),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching statistics',
    });
  }
};

/**
 * Delete a writing session
 * DELETE /api/writing/sessions/:sessionId
 */
const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await WritingSession.findOneAndDelete({
      _id: sessionId,
      userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting session',
    });
  }
};

/**
 * Analyze grammar for a text snippet
 * POST /api/writing/analyze/grammar
 */
const analyzeGrammar = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Text must be at least 20 characters',
      });
    }

    const result = await aiService.analyzeGrammar(text);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze grammar',
        details: result.error,
      });
    }

    res.json({
      success: true,
      analysis: result.analysis,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Analyze grammar error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error analyzing grammar',
    });
  }
};

/**
 * Analyze vocabulary for a text snippet
 * POST /api/writing/analyze/vocabulary
 */
const analyzeVocabulary = async (req, res) => {
  try {
    const { text, targetBand = 7 } = req.body;

    if (!text || text.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Text must be at least 20 characters',
      });
    }

    const result = await aiService.analyzeVocabulary(text, targetBand);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze vocabulary',
        details: result.error,
      });
    }

    res.json({
      success: true,
      analysis: result.analysis,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Analyze vocabulary error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error analyzing vocabulary',
    });
  }
};

module.exports = {
  generateTask,
  createSession,
  updateSession,
  submitForEvaluation,
  getSession,
  getSessions,
  getStats,
  deleteSession,
  analyzeGrammar,
  analyzeVocabulary,
};
