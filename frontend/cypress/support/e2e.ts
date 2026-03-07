/// <reference types="cypress" />
// ***********************************************************
// E2E Support File
// This file is processed and loaded automatically before E2E tests.
// ***********************************************************

import './commands';

// Prevent TypeScript errors when accessing Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      // Import custom commands
    }
  }
}

// Hide fetch/XHR requests from command log
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
  return true;
});
