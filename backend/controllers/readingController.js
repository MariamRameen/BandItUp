/**
 * Reading Controller
 * Handles all reading practice operations
 */

const ReadingSession = require('../models/ReadingSession');
const aiService = require('../services/aiService');
const { getQuestionTypesForDifficulty } = require('../services/prompts/readingPrompts');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get time limit based on question count
 * @param {number} questionCount - Number of questions
 * @returns {number} - Time limit in seconds
 */
const getTimeLimit = (questionCount) => {
  // Approximately 1.5 minutes per question, like real IELTS
  return questionCount * 90;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER METHODS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a new reading test (passage + questions)
 * POST /api/reading/generate
 */
const generateTest = async (req, res) => {
  try {
    const { examType, topic, difficulty, questionCount } = req.body;

    // Validate required fields
    if (!examType || !['Academic', 'General'].includes(examType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid exam type. Must be Academic or General.',
      });
    }

    const validDifficulties = ['Band 5-6', 'Band 6-7', 'Band 7-8', 'Band 8-9'];
    const actualDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'Band 6-7';
    const actualQuestionCount = questionCount && questionCount >= 5 && questionCount <= 15 
      ? questionCount 
      : 13;

    // Generate test using AI service
    const result = await aiService.generateReadingTest({
      examType,
      topic: topic || null,
      difficulty: actualDifficulty,
      questionCount: actualQuestionCount,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate reading test',
        details: result.error,
      });
    }

    res.json({
      success: true,
      passage: result.passage,
      questions: result.questions,
      questionCount: result.questions.length,
      timeLimit: getTimeLimit(result.questions.length),
      usage: result.usage,
    });
  } catch (error) {
    console.error('Error generating reading test:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating test',
    });
  }
};

/**
 * Start a new reading session
 * POST /api/reading/sessions
 */
const startSession = async (req, res) => {
  try {
    const { examType, difficulty, passage, questions, timeLimit } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!examType || !passage || !questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: examType, passage, questions',
      });
    }

    if (questions.length < 1) {
      return res.status(400).json({
        success: false,
        error: 'At least one question is required',
      });
    }

    // Create session
    const session = new ReadingSession({
      userId,
      examType,
      difficulty: difficulty || 'Band 6-7',
      passage: {
        title: passage.title,
        content: passage.content || passage.paragraphs.map(p => p.text).join('\n\n'),
        topic: passage.topic,
        wordCount: passage.wordCount,
        paragraphs: passage.paragraphs,
        source: passage.source,
      },
      questions: questions.map((q, index) => ({
        id: q.id || `q${index + 1}`,
        type: q.type,
        questionText: q.questionText,
        instruction: q.instruction,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        paragraphRef: q.paragraphRef,
        explanation: q.explanation,
      })),
      totalQuestions: questions.length,
      timeLimit: timeLimit || getTimeLimit(questions.length),
      status: 'in-progress',
      startedAt: new Date(),
    });

    await session.save();

    res.status(201).json({
      success: true,
      session: {
        id: session._id,
        examType: session.examType,
        difficulty: session.difficulty,
        passage: session.passage,
        questions: session.questions.map(q => ({
          id: q.id,
          type: q.type,
          questionText: q.questionText,
          instruction: q.instruction,
          options: q.options,
          paragraphRef: q.paragraphRef,
          // Don't send correct answers or explanations yet
        })),
        totalQuestions: session.totalQuestions,
        timeLimit: session.timeLimit,
        status: session.status,
        startedAt: session.startedAt,
      },
    });
  } catch (error) {
    console.error('Error starting reading session:', error);
    res.status(500).json({
      success: false,
      error: 'Server error starting session',
    });
  }
};

/**
 * Submit a single answer
 * PUT /api/reading/sessions/:sessionId/answer
 */
const submitAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, answer } = req.body;
    const userId = req.user._id;

    const session = await ReadingSession.findOne({ _id: sessionId, userId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: 'Session is not in progress',
      });
    }

    // Find and update the question
    const question = session.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    question.userAnswer = answer;
    await session.save();

    res.json({
      success: true,
      questionId,
      answer,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      success: false,
      error: 'Server error submitting answer',
    });
  }
};

/**
 * Submit all answers at once
 * PUT /api/reading/sessions/:sessionId/answers
 */
const submitAllAnswers = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers, timeSpent } = req.body;
    const userId = req.user._id;

    const session = await ReadingSession.findOne({ _id: sessionId, userId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: 'Session is not in progress',
      });
    }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Answers must be provided as an object',
      });
    }

    // Update all answers
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = session.questions.find(q => q.id === questionId);
      if (question) {
        question.userAnswer = answer;
      }
    });

    if (timeSpent !== undefined) {
      session.timeSpent = timeSpent;
    }

    await session.save();

    res.json({
      success: true,
      answersSubmitted: Object.keys(answers).length,
    });
  } catch (error) {
    console.error('Error submitting all answers:', error);
    res.status(500).json({
      success: false,
      error: 'Server error submitting answers',
    });
  }
};

/**
 * Complete a session and calculate scores
 * POST /api/reading/sessions/:sessionId/complete
 */
const completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { timeSpent } = req.body;
    const userId = req.user._id;

    const session = await ReadingSession.findOne({ _id: sessionId, userId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    if (session.status === 'completed') {
      // Already completed, just return the results
      return res.json({
        success: true,
        session: formatCompletedSession(session),
      });
    }

    if (session.status === 'abandoned') {
      return res.status(400).json({
        success: false,
        error: 'Session was abandoned',
      });
    }

    // Update time spent
    if (timeSpent !== undefined) {
      session.timeSpent = timeSpent;
    }

    // Check all answers and calculate scores
    session.checkAllAnswers(
      session.questions.reduce((acc, q) => {
        if (q.userAnswer !== undefined) {
          acc[q.id] = q.userAnswer;
        }
        return acc;
      }, {})
    );

    // Generate question type analysis
    const questionTypeAnalysis = session.analyzeQuestionTypes();

    // Generate AI feedback
    const feedbackResult = await aiService.generateReadingFeedback({
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      score: session.score,
      bandScore: session.bandScore,
      timeSpent: session.timeSpent,
      timeLimit: session.timeLimit,
      questionTypeAnalysis,
      questions: session.questions,
    });

    if (feedbackResult.success) {
      session.feedback = feedbackResult.feedback;
      session.aiUsage = feedbackResult.usage;
    } else {
      // Still complete session even if feedback fails
      session.feedback = {
        overallAnalysis: `You scored ${session.score}% (${session.correctAnswers}/${session.totalQuestions} correct), achieving a band score of ${session.bandScore}.`,
        strengths: [],
        weaknesses: [],
        recommendedPractice: [],
        questionTypeAnalysis,
      };
    }

    session.status = 'completed';
    session.completedAt = new Date();

    await session.save();

    res.json({
      success: true,
      session: formatCompletedSession(session),
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      error: 'Server error completing session',
    });
  }
};

/**
 * Format session for completed response
 */
const formatCompletedSession = (session) => ({
  id: session._id,
  examType: session.examType,
  difficulty: session.difficulty,
  passage: session.passage,
  questions: session.questions.map(q => ({
    id: q.id,
    type: q.type,
    questionText: q.questionText,
    instruction: q.instruction,
    options: q.options,
    correctAnswer: q.correctAnswer,
    userAnswer: q.userAnswer,
    isCorrect: q.isCorrect,
    paragraphRef: q.paragraphRef,
    explanation: q.explanation,
  })),
  totalQuestions: session.totalQuestions,
  correctAnswers: session.correctAnswers,
  score: session.score,
  bandScore: session.bandScore,
  timeLimit: session.timeLimit,
  timeSpent: session.timeSpent,
  status: session.status,
  feedback: session.feedback,
  startedAt: session.startedAt,
  completedAt: session.completedAt,
});

/**
 * Get a specific session
 * GET /api/reading/sessions/:sessionId
 */
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await ReadingSession.findOne({ _id: sessionId, userId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // If completed, show all info including answers
    if (session.status === 'completed' || session.status === 'abandoned') {
      return res.json({
        success: true,
        session: formatCompletedSession(session),
      });
    }

    // If in-progress, don't show correct answers
    res.json({
      success: true,
      session: {
        id: session._id,
        examType: session.examType,
        difficulty: session.difficulty,
        passage: session.passage,
        questions: session.questions.map(q => ({
          id: q.id,
          type: q.type,
          questionText: q.questionText,
          instruction: q.instruction,
          options: q.options,
          paragraphRef: q.paragraphRef,
          userAnswer: q.userAnswer,
        })),
        totalQuestions: session.totalQuestions,
        timeLimit: session.timeLimit,
        timeSpent: session.timeSpent,
        status: session.status,
        startedAt: session.startedAt,
      },
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting session',
    });
  }
};

/**
 * Get all sessions for user
 * GET /api/reading/sessions
 */
const getSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, examType, difficulty, page = 1, limit = 10 } = req.query;

    const query = { userId };

    if (status && ['in-progress', 'completed', 'abandoned'].includes(status)) {
      query.status = status;
    }

    if (examType && ['Academic', 'General'].includes(examType)) {
      query.examType = examType;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ReadingSession.countDocuments(query);

    const sessions = await ReadingSession.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-questions -aiUsage')
      .lean();

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s._id,
        examType: s.examType,
        difficulty: s.difficulty,
        passageTitle: s.passage?.title,
        passageTopic: s.passage?.topic,
        totalQuestions: s.totalQuestions,
        correctAnswers: s.correctAnswers,
        score: s.score,
        bandScore: s.bandScore,
        timeLimit: s.timeLimit,
        timeSpent: s.timeSpent,
        status: s.status,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        createdAt: s.createdAt,
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting sessions',
    });
  }
};

/**
 * Get user statistics
 * GET /api/reading/stats
 */
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await ReadingSession.getUserStats(userId);
    const recentProgress = await ReadingSession.getRecentProgress(userId, 10);

    res.json({
      success: true,
      stats,
      recentProgress: recentProgress.map(p => ({
        date: p.completedAt,
        bandScore: p.bandScore,
        score: p.score,
        examType: p.examType,
        difficulty: p.difficulty,
        topic: p.passage?.topic,
      })),
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting stats',
    });
  }
};

/**
 * Delete a session
 * DELETE /api/reading/sessions/:sessionId
 */
const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await ReadingSession.findOneAndDelete({ _id: sessionId, userId });

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
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting session',
    });
  }
};

/**
 * Abandon a session
 * PUT /api/reading/sessions/:sessionId/abandon
 */
const abandonSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { timeSpent } = req.body;
    const userId = req.user._id;

    const session = await ReadingSession.findOne({ _id: sessionId, userId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: 'Session is not in progress',
      });
    }

    session.status = 'abandoned';
    if (timeSpent !== undefined) {
      session.timeSpent = timeSpent;
    }
    session.completedAt = new Date();

    await session.save();

    res.json({
      success: true,
      message: 'Session abandoned',
    });
  } catch (error) {
    console.error('Error abandoning session:', error);
    res.status(500).json({
      success: false,
      error: 'Server error abandoning session',
    });
  }
};

module.exports = {
  generateTest,
  startSession,
  submitAnswer,
  submitAllAnswers,
  completeSession,
  getSession,
  getSessions,
  getStats,
  deleteSession,
  abandonSession,
};
