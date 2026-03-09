
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.OPENAI_API_KEY = 'test-api-key';

global.testHelpers = {
 
   
  generateTestToken: (userId = '507f1f77bcf86cd799439011') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  },

  /**
   * Create a mock user object
   */
  createMockUser: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    fullName: 'Test User',
    ...overrides,
  }),

  /**
   * Create a mock writing session
   */
  createMockSession: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439012',
    userId: '507f1f77bcf86cd799439011',
    taskType: 2,
    examType: 'Academic',
    task: {
      prompt: 'Some people believe that technology has made our lives too complex. To what extent do you agree or disagree?',
      essayType: 'opinion',
      topic: 'Technology',
    },
    essay: '',
    wordCount: 0,
    timeLimit: 2400,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

// Clean up after all tests
afterAll(async () => {
  // Allow any pending timers to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});
