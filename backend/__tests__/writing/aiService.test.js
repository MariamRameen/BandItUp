/**
 * AI Service Tests
 * Tests for the AI service module - focuses on error handling and structure
 * Note: Integration tests with real OpenAI would require a separate test suite
 */

describe('AI Service', () => {
  let aiService;

  beforeEach(() => {
    // Reset modules to get fresh import
    jest.resetModules();
    
    // Mock environment var
    process.env.OPENAI_API_KEY = 'test-key';
    
    // Import fresh instance
    aiService = require('../../services/aiService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Module Structure Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('Module Structure', () => {
    it('should export evaluateWriting function', () => {
      expect(typeof aiService.evaluateWriting).toBe('function');
    });

    it('should export generateWritingTask function', () => {
      expect(typeof aiService.generateWritingTask).toBe('function');
    });

    it('should export analyzeGrammar function', () => {
      expect(typeof aiService.analyzeGrammar).toBe('function');
    });

    it('should export analyzeVocabulary function', () => {
      expect(typeof aiService.analyzeVocabulary).toBe('function');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // evaluateWriting Tests (Error Handling)
  // ─────────────────────────────────────────────────────────────────────────

  describe('evaluateWriting', () => {
    it('should return object with success property', async () => {
      // This will fail due to no valid API key, but should return properly structured response
      const result = await aiService.evaluateWriting({
        taskType: 2,
        examType: 'Academic',
        taskPrompt: 'Test prompt',
        essay: 'Test essay',
      });

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle Task 1 Academic without crashing', async () => {
      const result = await aiService.evaluateWriting({
        taskType: 1,
        examType: 'Academic',
        taskPrompt: 'Describe the chart',
        essay: 'The chart shows data.',
      });

      expect(result).toHaveProperty('success');
    });

    it('should handle Task 1 General without crashing', async () => {
      const result = await aiService.evaluateWriting({
        taskType: 1,
        examType: 'General',
        taskPrompt: 'Write a letter',
        essay: 'Dear Sir/Madam...',
        metadata: { letterType: 'formal' },
      });

      expect(result).toHaveProperty('success');
    });

    it('should include error message on failure', async () => {
      const result = await aiService.evaluateWriting({
        taskType: 2,
        examType: 'Academic',
        taskPrompt: 'Test',
        essay: 'Test',
      });

      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // generateWritingTask Tests (Error Handling)
  // ─────────────────────────────────────────────────────────────────────────

  describe('generateWritingTask', () => {
    it('should return object with success property', async () => {
      const result = await aiService.generateWritingTask({
        taskType: 2,
        examType: 'Academic',
      });

      expect(result).toHaveProperty('success');
    });

    it('should handle Task 1 Academic generation', async () => {
      const result = await aiService.generateWritingTask({
        taskType: 1,
        examType: 'Academic',
        options: { chartType: 'bar' },
      });

      expect(result).toHaveProperty('success');
    });

    it('should handle Task 1 General generation', async () => {
      const result = await aiService.generateWritingTask({
        taskType: 1,
        examType: 'General',
        options: { letterType: 'formal' },
      });

      expect(result).toHaveProperty('success');
    });

    it('should accept options parameter', async () => {
      const result = await aiService.generateWritingTask({
        taskType: 2,
        examType: 'Academic',
        options: { topic: 'Technology', essayType: 'opinion' },
      });

      expect(result).toHaveProperty('success');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // analyzeGrammar Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('analyzeGrammar', () => {
    it('should return object with success property', async () => {
      const result = await aiService.analyzeGrammar('Test text for analysis');

      expect(result).toHaveProperty('success');
    });

    it('should handle empty text gracefully', async () => {
      const result = await aiService.analyzeGrammar('');

      expect(result).toHaveProperty('success');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // analyzeVocabulary Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('analyzeVocabulary', () => {
    it('should return object with success property', async () => {
      const result = await aiService.analyzeVocabulary('Test text for analysis', 7);

      expect(result).toHaveProperty('success');
    });

    it('should accept targetBand parameter', async () => {
      const result = await aiService.analyzeVocabulary('Test text', 8);

      expect(result).toHaveProperty('success');
    });

    it('should handle default targetBand', async () => {
      const result = await aiService.analyzeVocabulary('Test text');

      expect(result).toHaveProperty('success');
    });
  });
});
