/**
 * WritingSession Model Tests
 * Tests for the WritingSession Mongoose model
 */

const mongoose = require('mongoose');

// Mock mongoose before requiring the model
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      close: jest.fn().mockResolvedValue({}),
    },
  };
});

const WritingSession = require('../../models/WritingSession');

describe('WritingSession Model', () => {
  describe('Schema Definition', () => {
    it('should have required fields defined', () => {
      const schema = WritingSession.schema;
      
      // Check required fields
      expect(schema.path('userId')).toBeDefined();
      expect(schema.path('taskType')).toBeDefined();
      expect(schema.path('examType')).toBeDefined();
      expect(schema.path('task.prompt')).toBeDefined();
      expect(schema.path('timeLimit')).toBeDefined();
    });

    it('should have correct taskType enum defined', () => {
      const taskTypePath = WritingSession.schema.path('taskType');
      // Number enums are stored in validators, not enumValues
      expect(taskTypePath.options.enum).toEqual([1, 2]);
    });

    it('should have correct examType enum values', () => {
      const examTypePath = WritingSession.schema.path('examType');
      expect(examTypePath.enumValues).toEqual(['Academic', 'General']);
    });

    it('should have correct status enum values', () => {
      const statusPath = WritingSession.schema.path('status');
      expect(statusPath.enumValues).toEqual(['draft', 'submitted', 'evaluated']);
    });

    it('should have correct mode enum values', () => {
      const modePath = WritingSession.schema.path('mode');
      expect(modePath.enumValues).toEqual(['practice', 'test', 'baseline', 'mock']);
    });

    it('should have default values for optional fields', () => {
      const schema = WritingSession.schema;
      
      expect(schema.path('essay').defaultValue).toBe('');
      expect(schema.path('wordCount').defaultValue).toBe(0);
      expect(schema.path('timeSpent').defaultValue).toBe(0);
      expect(schema.path('status').defaultValue).toBe('draft');
      expect(schema.path('mode').defaultValue).toBe('practice');
    });
  });

  describe('Schema Validation', () => {
    it('should require userId', async () => {
      const session = new WritingSession({
        taskType: 2,
        examType: 'Academic',
        task: { prompt: 'Test prompt' },
        timeLimit: 2400,
      });

      let error;
      try {
        await session.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('should require taskType', async () => {
      const session = new WritingSession({
        userId: new mongoose.Types.ObjectId(),
        examType: 'Academic',
        task: { prompt: 'Test prompt' },
        timeLimit: 2400,
      });

      let error;
      try {
        await session.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.taskType).toBeDefined();
    });

    it('should reject invalid taskType', async () => {
      const session = new WritingSession({
        userId: new mongoose.Types.ObjectId(),
        taskType: 3, // Invalid
        examType: 'Academic',
        task: { prompt: 'Test prompt' },
        timeLimit: 2400,
      });

      let error;
      try {
        await session.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.taskType).toBeDefined();
    });

    it('should reject invalid examType', async () => {
      const session = new WritingSession({
        userId: new mongoose.Types.ObjectId(),
        taskType: 2,
        examType: 'Invalid',
        task: { prompt: 'Test prompt' },
        timeLimit: 2400,
      });

      let error;
      try {
        await session.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.examType).toBeDefined();
    });

    it('should require timeLimit', async () => {
      const session = new WritingSession({
        userId: new mongoose.Types.ObjectId(),
        taskType: 2,
        examType: 'Academic',
        task: { prompt: 'Test prompt' },
      });

      let error;
      try {
        await session.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.timeLimit).toBeDefined();
    });

    it('should accept valid session data', async () => {
      const session = new WritingSession({
        userId: new mongoose.Types.ObjectId(),
        taskType: 2,
        examType: 'Academic',
        task: { prompt: 'Test prompt', essayType: 'opinion' },
        timeLimit: 2400,
      });

      let error;
      try {
        await session.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeUndefined();
    });
  });

  describe('Evaluation Schema', () => {
    it('should accept valid evaluation data', async () => {
      const session = new WritingSession({
        userId: new mongoose.Types.ObjectId(),
        taskType: 2,
        examType: 'Academic',
        task: { prompt: 'Test prompt' },
        timeLimit: 2400,
        evaluation: {
          overallBand: 7.0,
          criteria: {
            taskResponse: { band: 7.0, feedback: 'Good response' },
            coherenceCohesion: { band: 7.0, feedback: 'Well organized' },
            lexicalResource: { band: 6.5, feedback: 'Good vocabulary' },
            grammaticalRange: { band: 7.0, feedback: 'Accurate grammar' },
          },
          strengths: ['Clear thesis', 'Good examples'],
          improvements: ['More complex sentences'],
          grammarErrors: [
            {
              original: 'They is',
              correction: 'They are',
              explanation: 'Subject-verb agreement',
            },
          ],
          vocabularySuggestions: [
            {
              original: 'good',
              upgrade: 'beneficial',
              context: 'describing advantages',
            },
          ],
        },
      });

      let error;
      try {
        await session.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeUndefined();
    });

    it('should validate band score range', async () => {
      const session = new WritingSession({
        userId: new mongoose.Types.ObjectId(),
        taskType: 2,
        examType: 'Academic',
        task: { prompt: 'Test prompt' },
        timeLimit: 2400,
        evaluation: {
          overallBand: 10, // Invalid - should be 0-9
        },
      });

      let error;
      try {
        await session.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have userId index', () => {
      const indexes = WritingSession.schema.indexes();
      const userIdIndex = indexes.find(idx => 
        idx[0].userId !== undefined
      );
      expect(userIdIndex).toBeDefined();
    });
  });
});
