/// <reference types="cypress" />
// ***********************************************
// Custom commands for BandItUp E2E Tests
// ***********************************************

import '@testing-library/cypress/add-commands';

// Types for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login as a test user
       * @param email - User email
       * @param password - User password
       */
      login(email?: string, password?: string): Chainable<void>;

      /**
       * Logout current user
       */
      logout(): Chainable<void>;

      /**
       * Wait for API response
       * @param alias - The intercepted request alias
       */
      waitForApi(alias: string): Chainable<void>;

      /**
       * Set authentication token in cookies/localStorage
       * @param token - JWT token
       */
      setAuthToken(token: string): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email = 'test@example.com', password = 'Test123!') => {
  cy.session([email, password], () => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/login`,
      body: { email, password },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 200 && response.body.token) {
        cy.setCookie('token', response.body.token);
        cy.window().then((win) => {
          win.localStorage.setItem('token', response.body.token);
          if (response.body.user) {
            win.localStorage.setItem('user', JSON.stringify(response.body.user));
          }
        });
      }
    });
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.clearCookies();
  cy.clearLocalStorage();
});

// Wait for API command
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(`@${alias}`).its('response.statusCode').should('be.oneOf', [200, 201]);
});

// Set auth token directly
Cypress.Commands.add('setAuthToken', (token: string) => {
  cy.setCookie('token', token);
  cy.window().then((win) => {
    win.localStorage.setItem('token', token);
  });
});

export {};
