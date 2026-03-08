/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;      
      loginUI(email: string, password: string): Chainable<void>;    
      loginToken(email: string, password: string): Chainable<void>; 

    }
  }
}

export {};

