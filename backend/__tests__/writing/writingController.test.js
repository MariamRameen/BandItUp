/**
 * Writing Controller Tests
 * Unit tests for writing controller endpoints
 */

const WritingSession = require('../../models/WritingSession');
const aiService = require('../../services/aiService');

// Mock dependencies
jest.mock('../../models/WritingSession');
jest.mock('../../services/aiService');

// Import controller after mocks
const writingController = require('../../controllers/writingController');

describe('Writing Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockReq = {
      user: { id: '507f1f77bcf86cd799439011' },
      body: {},
      params: {},
      query: {},
    };

    // Setup mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ─────────────────────────────────────────────────────────────────────────
  // generateTask Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('generateTask', () => {
    it('should return 400 for invalid taskType', async () => {
      mockReq.body = { taskType: 3, examType: 'Academic' };

      await writingController.generateTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid taskType. Must be 1 or 2.',
      });
    });

    it('should return 400 for missing taskType', async () => {
      mockReq.body = { examType: 'Academic' };

      await writingController.generateTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid examType', async () => {
      mockReq.body = { taskType: 2, examType: 'Invalid' };

      await writingController.generateTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid examType. Must be Academic or General.',
      });
    });

    it('should successfully generate a task', async () => {
      mockReq.body = { taskType: 2, examType: 'Academic', options: { topic: 'Technology' } };

      const mockTask = {
        prompt: 'Some people believe that technology...',
        essayType: 'opinion',
        topic: 'Technology',
        vocabularyHints: ['innovation', 'digital'],
      };

      aiService.generateWritingTask.mockResolvedValue({
        success: true,
        task: mockTask,
        usage: { totalTokens: 100 },
      });

      await writingController.generateTask(mockReq, mockRes);

      expect(aiService.generateWritingTask).toHaveBeenCalledWith({
        taskType: 2,
        examType: 'Academic',
        options: { topic: 'Technology' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        task: mockTask,
        usage: { totalTokens: 100 },
      });
    });

    it('should handle AI service failure', async () => {
      mockReq.body = { taskType: 2, examType: 'Academic' };

      aiService.generateWritingTask.mockResolvedValue({
        success: false,
        error: 'OpenAI API error',
      });

      await writingController.generateTask(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to generate task',
        details: 'OpenAI API error',
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // createSession Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('createSession', () => {
    it('should return 400 for invalid taskType', async () => {
      mockReq.body = {
        taskType: 3,
        examType: 'Academic',
        task: { prompt: 'Test prompt' },
      };

      await writingController.createSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for missing task prompt', async () => {
      mockReq.body = {
        taskType: 2,
        examType: 'Academic',
        task: {},
      };

      await writingController.createSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Task with prompt is required.',
      });
    });

    it('should successfully create a session', async () => {
      const mockTask = { prompt: 'Test writing prompt' };
      mockReq.body = {
        taskType: 2,
        examType: 'Academic',
        task: mockTask,
        essay: '',
      };

      const mockSavedSession = {
        _id: '507f1f77bcf86cd799439012',
        userId: mockReq.user.id,
        taskType: 2,
        examType: 'Academic',
        task: mockTask,
        essay: '',
        wordCount: 0,
        timeLimit: 2400,
        status: 'draft',
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      WritingSession.mockImplementation(() => mockSavedSession);

      await writingController.createSession(mockReq, mockRes);

      expect(mockSavedSession.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        session: expect.objectContaining({
          id: '507f1f77bcf86cd799439012',
          taskType: 2,
          examType: 'Academic',
          status: 'draft',
        }),
      });
    });

    it('should set correct timeLimit for Task 1', async () => {
      mockReq.body = {
        taskType: 1,
        examType: 'Academic',
        task: { prompt: 'Describe the chart...' },
      };

      const mockSession = {
        _id: '507f1f77bcf86cd799439012',
        timeLimit: 1200,
        save: jest.fn().mockResolvedValue(true),
      };

      WritingSession.mockImplementation((data) => {
        expect(data.timeLimit).toBe(1200); // 20 minutes
        return { ...mockSession, ...data };
      });

      await writingController.createSession(mockReq, mockRes);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // updateSession Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('updateSession', () => {
    it('should return 404 if session not found', async () => {
      mockReq.params = { sessionId: '507f1f77bcf86cd799439012' };
      mockReq.body = { essay: 'Updated essay content' };

      WritingSession.findOne.mockResolvedValue(null);

      await writingController.updateSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found',
      });
    });

    it('should return 400 if session is already evaluated', async () => {
      mockReq.params = { sessionId: '507f1f77bcf86cd799439012' };
      mockReq.body = { essay: 'Updated essay content' };

      const mockSession = {
        _id: '507f1f77bcf86cd799439012',
        status: 'evaluated',
      };

      WritingSession.findOne.mockResolvedValue(mockSession);

      await writingController.updateSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot update an already evaluated session',
      });
    });

    it('should successfully update session essay', async () => {
      mockReq.params = { sessionId: '507f1f77bcf86cd799439012' };
      mockReq.body = { essay: 'This is my updated essay content for testing purposes.' };

      const mockSession = {
        _id: '507f1f77bcf86cd799439012',
        status: 'draft',
        essay: '',
        wordCount: 0,
        timeSpent: 0,
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      WritingSession.findOne.mockResolvedValue(mockSession);

      await writingController.updateSession(mockReq, mockRes);

      expect(mockSession.essay).toBe(mockReq.body.essay);
      expect(mockSession.wordCount).toBe(9); // Word count
      expect(mockSession.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        session: expect.objectContaining({
          id: '507f1f77bcf86cd799439012',
        }),
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // submitForEvaluation Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('submitForEvaluation', () => {
    it('should return 404 if session not found', async () => {
      mockReq.params = { sessionId: '507f1f77bcf86cd799439012' };
      mockReq.body = { essay: 'Essay content' };

      WritingSession.findOne.mockResolvedValue(null);

      await writingController.submitForEvaluation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if session already evaluated', async () => {
      mockReq.params = { sessionId: '507f1f77bcf86cd799439012' };

      WritingSession.findOne.mockResolvedValue({ status: 'evaluated' });

      await writingController.submitForEvaluation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session already evaluated',
      });
    });

    it('should return 400 if essay is too short', async () => {
      mockReq.params = { sessionId: '507f1f77bcf86cd799439012' };
      mockReq.body = { essay: 'Too short' };

      WritingSession.findOne.mockResolvedValue({
        status: 'draft',
        essay: '',
      });

      await writingController.submitForEvaluation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Essay must be at least 50 characters',
      });
    });

    it('should successfully evaluate essay', async () => {
      const longEssay = 'This is a sufficiently long essay content for testing the evaluation endpoint. '.repeat(5);
      
      mockReq.params = { sessionId: '507f1f77bcf86cd799439012' };
      mockReq.body = { essay: longEssay, timeSpent: 1500 };

      const mockSession = {
        _id: '507f1f77bcf86cd799439012',
        taskType: 2,
        examType: 'Academic',
        task: { prompt: 'Test prompt', essayType: 'opinion' },
        status: 'draft',
        essay: '',
        save: jest.fn().mockResolvedValue(true),
      };

      const mockEvaluation = {
        overallBand: 7.0,
        criteria: {
          taskResponse: { band: 7.0, feedback: 'Good response' },
          coherenceCohesion: { band: 7.0, feedback: 'Well organized' },
          lexicalResource: { band: 6.5, feedback: 'Good vocabulary' },
          grammaticalRange: { band: 7.0, feedback: 'Accurate grammar' },
        },
        strengths: ['Clear thesis'],
        improvements: ['More examples'],
        grammarErrors: [],
        vocabularySuggestions: [],
      };

      WritingSession.findOne.mockResolvedValue(mockSession);
      aiService.evaluateWriting.mockResolvedValue({
        success: true,
        evaluation: mockEvaluation,
        usage: { totalTokens: 500 },
      });

      await writingController.submitForEvaluation(mockReq, mockRes);

      expect(aiService.evaluateWriting).toHaveBeenCalled();
      expect(mockSession.status).toBe('evaluated');
      expect(mockSession.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        session: expect.objectContaining({
          id: '507f1f77bcf86cd799439012',
          status: 'evaluated',
        }),
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getSession Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('getSession', () => {
    it('should return 404 if session not found', async () => {
      mockReq.params = { sessionId: '507f1f77bcf86cd799439012' };

      WritingSession.findOne.mockResolvedValue(null);

      await writingController.getSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return session successfully', async () => {
      mockReq.params = { sessionId: '507f1f77bcf86cd799439012' };

      const mockSession = {
        _id: '507f1f77bcf86cd799439012',
        taskType: 2,
        examType: 'Academic',
        status: 'draft',
      };

      WritingSession.findOne.mockResolvedValue(mockSession);

      await writingController.getSession(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        session: mockSession,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getSessions Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('getSessions', () => {
    it('should return paginated sessions', async () => {
      mockReq.query = { page: '1', limit: '10' };

      const mockSessions = [
        { _id: '1', taskType: 2, status: 'draft' },
        { _id: '2', taskType: 1, status: 'evaluated' },
      ];

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockSessions),
      };

      WritingSession.find.mockReturnValue(mockFind);
      WritingSession.countDocuments.mockResolvedValue(2);

      await writingController.getSessions(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        sessions: mockSessions,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
    });

    it('should filter by status', async () => {
      mockReq.query = { status: 'evaluated' };

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([]),
      };

      WritingSession.find.mockReturnValue(mockFind);
      WritingSession.countDocuments.mockResolvedValue(0);

      await writingController.getSessions(mockReq, mockRes);

      expect(WritingSession.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'evaluated' })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // deleteSession Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('deleteSession', () => {
    it('should return 404 if session not found', async () => {
      mockReq.params = { sessionId: '507f1f77bcf86cd799439012' };

      WritingSession.findOneAndDelete.mockResolvedValue(null);

      await writingController.deleteSession(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should delete session successfully', async () => {
      mockReq.params = { sessionId: '507f1f77bcf86cd799439012' };

      WritingSession.findOneAndDelete.mockResolvedValue({ _id: '507f1f77bcf86cd799439012' });

      await writingController.deleteSession(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session deleted successfully',
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // analyzeGrammar Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('analyzeGrammar', () => {
    it('should return 400 for text too short', async () => {
      mockReq.body = { text: 'Too short' };

      await writingController.analyzeGrammar(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Text must be at least 20 characters',
      });
    });

    it('should successfully analyze grammar', async () => {
      mockReq.body = { text: 'This is a sufficiently long text for grammar analysis testing.' };

      const mockAnalysis = {
        errors: [
          { original: 'has', correction: 'have', explanation: 'Subject-verb agreement' },
        ],
        suggestions: ['Use active voice'],
      };

      aiService.analyzeGrammar.mockResolvedValue({
        success: true,
        analysis: mockAnalysis,
        usage: { totalTokens: 100 },
      });

      await writingController.analyzeGrammar(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        analysis: mockAnalysis,
        usage: { totalTokens: 100 },
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // analyzeVocabulary Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('analyzeVocabulary', () => {
    it('should return 400 for text too short', async () => {
      mockReq.body = { text: 'Short' };

      await writingController.analyzeVocabulary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should successfully analyze vocabulary with default targetBand', async () => {
      mockReq.body = { text: 'This is a sufficiently long text for vocabulary analysis testing.' };

      const mockAnalysis = {
        suggestions: [
          { original: 'good', upgrade: 'beneficial', context: 'describing quality' },
        ],
        bandLevel: 7,
      };

      aiService.analyzeVocabulary.mockResolvedValue({
        success: true,
        analysis: mockAnalysis,
        usage: { totalTokens: 100 },
      });

      await writingController.analyzeVocabulary(mockReq, mockRes);

      expect(aiService.analyzeVocabulary).toHaveBeenCalledWith(
        mockReq.body.text,
        7 // Default targetBand
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        analysis: mockAnalysis,
        usage: { totalTokens: 100 },
      });
    });

    it('should use custom targetBand', async () => {
      mockReq.body = { 
        text: 'This is a sufficiently long text for vocabulary analysis testing.',
        targetBand: 8
      };

      aiService.analyzeVocabulary.mockResolvedValue({
        success: true,
        analysis: {},
        usage: {},
      });

      await writingController.analyzeVocabulary(mockReq, mockRes);

      expect(aiService.analyzeVocabulary).toHaveBeenCalledWith(
        mockReq.body.text,
        8
      );
    });
  });
});
