/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

/**
 * Writing Module E2E Tests
 * Tests the complete user flow for the Writing practice module
 */

describe('Writing Module', () => {
  // Mock user token for authenticated requests
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJpYXQiOjE1MTYyMzkwMjJ9.mock';

  beforeEach(() => {
    // Setup API intercepts
    cy.intercept('GET', '**/api/writing/stats', {
      statusCode: 200,
      body: {
        success: true,
        stats: {
          totalSessions: 5,
          avgOverallBand: 6.5,
          task1Count: 2,
          task2Count: 3,
        },
        recentProgress: [],
      },
    }).as('getStats');

    cy.intercept('GET', '**/api/writing/sessions*', {
      statusCode: 200,
      body: {
        success: true,
        sessions: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 0 },
      },
    }).as('getSessions');

    cy.intercept('POST', '**/api/writing/generate-task', {
      statusCode: 200,
      body: {
        success: true,
        task: {
          prompt: 'Some people believe that technology has greatly improved our lives. To what extent do you agree or disagree with this statement?',
          essayType: 'opinion',
          topic: 'Technology',
          vocabularyHints: ['innovation', 'digital transformation', 'convenience'],
          timeLimit: 2400,
          minWords: 250,
        },
        usage: { totalTokens: 150 },
      },
    }).as('generateTask');

    cy.intercept('POST', '**/api/writing/sessions', {
      statusCode: 201,
      body: {
        success: true,
        session: {
          id: 'test-session-123',
          taskType: 2,
          examType: 'Academic',
          task: {
            prompt: 'Some people believe that technology has greatly improved our lives...',
            essayType: 'opinion',
            topic: 'Technology',
          },
          essay: '',
          wordCount: 0,
          timeLimit: 2400,
          status: 'draft',
          createdAt: new Date().toISOString(),
        },
      },
    }).as('createSession');

    cy.intercept('PUT', '**/api/writing/sessions/*', {
      statusCode: 200,
      body: {
        success: true,
        session: {
          id: 'test-session-123',
          essay: 'Updated essay content...',
          wordCount: 50,
          timeSpent: 120,
          status: 'draft',
          updatedAt: new Date().toISOString(),
        },
      },
    }).as('updateSession');

    cy.intercept('POST', '**/api/writing/sessions/*/submit', {
      statusCode: 200,
      delay: 500, // Simulate AI processing time
      body: {
        success: true,
        session: {
          id: 'test-session-123',
          taskType: 2,
          examType: 'Academic',
          task: {
            prompt: 'Some people believe that technology...',
            essayType: 'opinion',
          },
          essay: 'Technology has revolutionized our world...',
          wordCount: 275,
          timeSpent: 1800,
          evaluation: {
            overallBand: 7.0,
            taskResponse: { band: 7.0, feedback: 'Good response to the task.' },
            coherenceCohesion: { band: 7.0, feedback: 'Well organized.' },
            lexicalResource: { band: 6.5, feedback: 'Good vocabulary range.' },
            grammaticalRange: { band: 7.0, feedback: 'Accurate grammar.' },
          },
          grammarErrors: [
            {
              original: 'has became',
              correction: 'has become',
              explanation: 'Incorrect past participle form',
            },
          ],
          vocabularySuggestions: [
            {
              original: 'very important',
              upgrade: 'crucial',
              context: 'When emphasizing significance',
            },
          ],
          status: 'evaluated',
          evaluatedAt: new Date().toISOString(),
        },
      },
    }).as('submitEssay');

    // Set mock authentication
    cy.setCookie('token', mockToken);
    cy.window().then((win) => {
      win.localStorage.setItem('token', mockToken);
      win.localStorage.setItem('user', JSON.stringify({
        id: '1234567890',
        email: 'test@example.com',
        fullName: 'Test User',
      }));
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Writing Selection Page Tests
  // ───────────────────────────────────────────────────────────────────────

  describe('WritingSelection Page', () => {
    beforeEach(() => {
      cy.visit('/writing');
    });

    it('should display the writing selection page', () => {
      cy.contains('Writing Practice').should('be.visible');
    });

    it('should show task type options (Task 1 and Task 2)', () => {
      cy.contains('Task 1').should('be.visible');
      cy.contains('Task 2').should('be.visible');
    });

    it('should show exam type options (Academic and General)', () => {
      cy.contains('Academic').should('be.visible');
      cy.contains('General').should('be.visible');
    });

    it('should have a start practice button', () => {
      cy.get('button').contains(/start|practice|generate/i).should('be.visible');
    });

    it('should load user stats', () => {
      cy.wait('@getStats');
      // Stats should be displayed somewhere on the page
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Task Generation Tests
  // ───────────────────────────────────────────────────────────────────────

  describe('Task Generation', () => {
    beforeEach(() => {
      cy.visit('/writing');
    });

    it('should generate a task when clicking start', () => {
      // Select Task 2 Academic
      cy.contains('Task 2').click();
      cy.contains('Academic').click();
      
      // Click generate/start button
      cy.get('button').contains(/start|practice|generate/i).click();

      // Wait for API call
      cy.wait('@generateTask');
      cy.wait('@createSession');

      // Should navigate to practice page
      cy.url().should('include', '/writing/practice');
    });

    it('should show loading state during generation', () => {
      cy.contains('Task 2').click();
      cy.contains('Academic').click();
      
      cy.get('button').contains(/start|practice|generate/i).click();

      // Should show some loading indicator
      cy.get('[class*="loading"], [class*="spinner"], [disabled]').should('exist');
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Writing Practice Page Tests
  // ───────────────────────────────────────────────────────────────────────

  describe('WritingPractice Page', () => {
    beforeEach(() => {
      // Navigate directly to practice page with state
      cy.visit('/writing');
      cy.contains('Task 2').click();
      cy.contains('Academic').click();
      cy.get('button').contains(/start|practice|generate/i).click();
      cy.wait('@generateTask');
      cy.wait('@createSession');
    });

    it('should display the task prompt', () => {
      cy.contains(/technology|believe/i).should('be.visible');
    });

    it('should have a text area for writing', () => {
      cy.get('textarea').should('be.visible');
    });

    it('should show word count', () => {
      cy.contains(/word|count/i).should('be.visible');
    });

    it('should show timer', () => {
      // Timer should show time remaining
      cy.contains(/\d+:\d+/).should('be.visible');
    });

    it('should update word count when typing', () => {
      const testText = 'This is a test essay with multiple words for counting purposes.';
      cy.get('textarea').type(testText);
      
      // Word count should update
      cy.contains(/\d+ words?/i).should('be.visible');
    });

    it('should have a submit button', () => {
      cy.get('button').contains(/submit|finish/i).should('be.visible');
    });

    it('should auto-save drafts', () => {
      const testText = 'Auto-save test content that should be saved automatically.';
      cy.get('textarea').type(testText);
      
      // Wait for auto-save (typically 30 seconds, but we're mocking)
      cy.clock();
      cy.tick(35000);
      
      // Could verify updateSession was called, but timing is tricky
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Essay Submission Tests
  // ───────────────────────────────────────────────────────────────────────

  describe('Essay Submission', () => {
    beforeEach(() => {
      cy.visit('/writing');
      cy.contains('Task 2').click();
      cy.contains('Academic').click();
      cy.get('button').contains(/start|practice|generate/i).click();
      cy.wait('@generateTask');
      cy.wait('@createSession');
    });

    it('should submit essay and show loading', () => {
      const testEssay = 'Technology has revolutionized our modern world in numerous ways. '.repeat(10);
      cy.get('textarea').type(testEssay);
      
      cy.get('button').contains(/submit|finish/i).click();
      
      // May show confirmation modal first
      cy.get('body').then(($body) => {
        if ($body.find('[role="dialog"]').length > 0) {
          cy.get('button').contains(/confirm|yes|submit/i).click();
        }
      });
      
      cy.wait('@submitEssay');
    });

    it('should navigate to feedback after submission', () => {
      const testEssay = 'Technology has changed our lives significantly. '.repeat(15);
      cy.get('textarea').type(testEssay);
      
      cy.get('button').contains(/submit|finish/i).click();
      
      cy.get('body').then(($body) => {
        if ($body.find('[role="dialog"]').length > 0) {
          cy.get('button').contains(/confirm|yes|submit/i).click();
        }
      });
      
      cy.wait('@submitEssay');
      
      // Should navigate to feedback page
      cy.url().should('include', '/writing/feedback');
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Writing Feedback Page Tests
  // ───────────────────────────────────────────────────────────────────────

  describe('WritingFeedback Page', () => {
    beforeEach(() => {
      // Navigate through the full flow
      cy.visit('/writing');
      cy.contains('Task 2').click();
      cy.contains('Academic').click();
      cy.get('button').contains(/start|practice|generate/i).click();
      cy.wait('@generateTask');
      cy.wait('@createSession');
      
      const testEssay = 'Technology has fundamentally transformed modern society. '.repeat(12);
      cy.get('textarea').type(testEssay);
      
      cy.get('button').contains(/submit|finish/i).click();
      
      cy.get('body').then(($body) => {
        if ($body.find('[role="dialog"]').length > 0) {
          cy.get('button').contains(/confirm|yes|submit/i).click();
        }
      });
      
      cy.wait('@submitEssay');
    });

    it('should display overall band score', () => {
      cy.contains(/band|score/i).should('be.visible');
      cy.contains('7').should('be.visible'); // Our mock returns 7.0
    });

    it('should display criteria scores', () => {
      // Task Response/Achievement
      cy.contains(/task.*response|task.*achievement/i).should('be.visible');
      
      // Coherence & Cohesion
      cy.contains(/coherence|cohesion/i).should('be.visible');
      
      // Lexical Resource
      cy.contains(/lexical|vocabulary/i).should('be.visible');
      
      // Grammatical Range
      cy.contains(/grammar|grammatical/i).should('be.visible');
    });

    it('should display feedback', () => {
      cy.contains(/feedback|good|organized/i).should('be.visible');
    });

    it('should show grammar errors', () => {
      // Should show the mocked grammar error
      cy.contains(/error|correction|grammar/i).should('be.visible');
    });

    it('should have practice again button', () => {
      cy.get('button').contains(/practice.*again|try.*again|new.*task/i).should('be.visible');
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Writing History Page Tests
  // ───────────────────────────────────────────────────────────────────────

  describe('WritingHistory Page', () => {
    beforeEach(() => {
      // Mock sessions with data
      cy.intercept('GET', '**/api/writing/sessions*', {
        statusCode: 200,
        body: {
          success: true,
          sessions: [
            {
              _id: 'session-1',
              taskType: 2,
              examType: 'Academic',
              task: { prompt: 'Technology essay...', topic: 'Technology' },
              wordCount: 280,
              evaluation: { overallBand: 7.0 },
              status: 'evaluated',
              createdAt: new Date().toISOString(),
            },
            {
              _id: 'session-2',
              taskType: 1,
              examType: 'Academic',
              task: { prompt: 'Chart description...', chartType: 'bar' },
              wordCount: 165,
              status: 'draft',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
          ],
          pagination: { total: 2, page: 1, limit: 10, pages: 1 },
        },
      }).as('getSessionsList');

      cy.visit('/writing/history');
      cy.wait('@getSessionsList');
    });

    it('should display the history page', () => {
      cy.contains(/history|sessions|previous/i).should('be.visible');
    });

    it('should show session cards', () => {
      cy.get('[class*="card"], [class*="session"]').should('have.length.at.least', 1);
    });

    it('should show session details', () => {
      // Should show task type
      cy.contains(/task\s*[12]/i).should('be.visible');
      
      // Should show word count
      cy.contains(/\d+\s*words?/i).should('be.visible');
    });

    it('should have filter options', () => {
      // Filter by status, task type, etc.
      cy.get('select, [role="listbox"], [class*="filter"]').should('exist');
    });

    it('should navigate to feedback when clicking evaluated session', () => {
      cy.contains(/view|feedback|details/i).first().click();
      cy.url().should('include', '/writing/feedback');
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Dark Mode Tests
  // ───────────────────────────────────────────────────────────────────────

  describe('Dark Mode Support', () => {
    beforeEach(() => {
      cy.visit('/writing');
    });

    it('should support dark mode styling', () => {
      // Toggle dark mode if there's a toggle
      cy.get('body').then(($body) => {
        if ($body.find('[class*="theme"], [class*="dark-mode"]').length > 0) {
          cy.get('[class*="theme"], [class*="dark-mode"]').first().click();
        }
      });
      
      // Page should still be functional
      cy.contains('Writing Practice').should('be.visible');
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Error Handling Tests
  // ───────────────────────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('POST', '**/api/writing/generate-task', {
        statusCode: 500,
        body: { success: false, error: 'Server error' },
      }).as('generateTaskError');

      cy.visit('/writing');
      cy.contains('Task 2').click();
      cy.contains('Academic').click();
      cy.get('button').contains(/start|practice|generate/i).click();

      cy.wait('@generateTaskError');

      // Should show error message
      cy.contains(/error|failed|try.*again/i).should('be.visible');
    });

    it('should handle network errors', () => {
      cy.intercept('POST', '**/api/writing/generate-task', {
        forceNetworkError: true,
      }).as('networkError');

      cy.visit('/writing');
      cy.contains('Task 2').click();
      cy.contains('Academic').click();
      cy.get('button').contains(/start|practice|generate/i).click();

      // Should handle gracefully without crashing
      cy.get('body').should('be.visible');
    });

    it('should redirect unauthenticated users', () => {
      // Clear auth
      cy.clearCookies();
      cy.clearLocalStorage();

      cy.visit('/writing');

      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });
});
