/**
 * Reading Routes
 * All routes for reading practice module
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const readingController = require('../controllers/readingController');

// All routes require authentication
router.use(auth);

// ─────────────────────────────────────────────────────────────────────────────
// TEST GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/reading/generate
 * @desc    Generate a new reading test (passage + questions)
 * @access  Private
 * @body    { examType: 'Academic'|'General', topic?: string, difficulty?: string, questionCount?: number }
 */
router.post('/generate', readingController.generateTest);

// ─────────────────────────────────────────────────────────────────────────────
// SESSION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/reading/sessions
 * @desc    Start a new reading session
 * @access  Private
 * @body    { examType, difficulty, passage, questions, timeLimit }
 */
router.post('/sessions', readingController.startSession);

/**
 * @route   GET /api/reading/sessions
 * @desc    Get all reading sessions for user
 * @access  Private
 * @query   status, examType, difficulty, page, limit
 */
router.get('/sessions', readingController.getSessions);

/**
 * @route   GET /api/reading/sessions/:sessionId
 * @desc    Get a specific reading session
 * @access  Private
 */
router.get('/sessions/:sessionId', readingController.getSession);

/**
 * @route   DELETE /api/reading/sessions/:sessionId
 * @desc    Delete a reading session
 * @access  Private
 */
router.delete('/sessions/:sessionId', readingController.deleteSession);

// ─────────────────────────────────────────────────────────────────────────────
// ANSWER SUBMISSION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   PUT /api/reading/sessions/:sessionId/answer
 * @desc    Submit a single answer
 * @access  Private
 * @body    { questionId, answer }
 */
router.put('/sessions/:sessionId/answer', readingController.submitAnswer);

/**
 * @route   PUT /api/reading/sessions/:sessionId/answers
 * @desc    Submit all answers at once
 * @access  Private
 * @body    { answers: { questionId: answer, ... }, timeSpent?: number }
 */
router.put('/sessions/:sessionId/answers', readingController.submitAllAnswers);

// ─────────────────────────────────────────────────────────────────────────────
// SESSION COMPLETION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/reading/sessions/:sessionId/complete
 * @desc    Complete session and get scores/feedback
 * @access  Private
 * @body    { timeSpent?: number }
 */
router.post('/sessions/:sessionId/complete', readingController.completeSession);

/**
 * @route   PUT /api/reading/sessions/:sessionId/abandon
 * @desc    Abandon an in-progress session
 * @access  Private
 * @body    { timeSpent?: number }
 */
router.put('/sessions/:sessionId/abandon', readingController.abandonSession);

// ─────────────────────────────────────────────────────────────────────────────
// STATISTICS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/reading/stats
 * @desc    Get user's reading statistics
 * @access  Private
 */
router.get('/stats', readingController.getStats);

module.exports = router;
