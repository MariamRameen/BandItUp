/**
 * Writing Module Routes
 * 
 * All routes require authentication via auth middleware
 */

const express = require('express');
const router = express.Router();
const writingController = require('../controllers/writingController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// ─────────────────────────────────────────────────────────────────────────────
// Task Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/writing/generate-task
 * Generate a new writing task using AI
 * Body: { taskType: 1|2, examType: 'Academic'|'General', options: {...} }
 */
router.post('/generate-task', writingController.generateTask);

// ─────────────────────────────────────────────────────────────────────────────
// Session Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/writing/sessions
 * Create a new writing session (start practice)
 * Body: { taskType, examType, task, essay? }
 */
router.post('/sessions', writingController.createSession);

/**
 * GET /api/writing/sessions
 * Get all writing sessions for current user
 * Query: ?status=draft|submitted|evaluated&taskType=1|2&examType=Academic|General&limit=20&page=1
 */
router.get('/sessions', writingController.getSessions);

/**
 * GET /api/writing/sessions/:sessionId
 * Get a specific writing session with full details
 */
router.get('/sessions/:sessionId', writingController.getSession);

/**
 * PUT /api/writing/sessions/:sessionId
 * Update a writing session (save draft)
 * Body: { essay, timeSpent? }
 */
router.put('/sessions/:sessionId', writingController.updateSession);

/**
 * POST /api/writing/sessions/:sessionId/submit
 * Submit essay for AI evaluation
 * Body: { essay?, timeSpent? }
 */
router.post('/sessions/:sessionId/submit', writingController.submitForEvaluation);

/**
 * DELETE /api/writing/sessions/:sessionId
 * Delete a writing session
 */
router.delete('/sessions/:sessionId', writingController.deleteSession);

// ─────────────────────────────────────────────────────────────────────────────
// Statistics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/writing/stats
 * Get writing statistics for current user
 */
router.get('/stats', writingController.getStats);

// ─────────────────────────────────────────────────────────────────────────────
// Text Analysis (Standalone)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/writing/analyze/grammar
 * Analyze text for grammar errors
 * Body: { text }
 */
router.post('/analyze/grammar', writingController.analyzeGrammar);

/**
 * POST /api/writing/analyze/vocabulary
 * Analyze vocabulary and get suggestions
 * Body: { text, targetBand? }
 */
router.post('/analyze/vocabulary', writingController.analyzeVocabulary);

module.exports = router;
