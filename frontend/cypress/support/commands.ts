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

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env("apiUrl")}/api/auth/login`,
    body: { email, password },
    failOnStatusCode: false, 
  }).then((resp) => {
    expect(resp.status).to.eq(200); 
    localStorage.setItem('token', resp.body.token);
    localStorage.setItem('user', JSON.stringify(resp.body.user));
  });
});


Cypress.Commands.add('loginUI', (email: string, password: string) => {
  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password);
  cy.contains('Sign In').click();
});


Cypress.Commands.add('loginToken', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env("apiUrl")}/api/auth/login`,
    body: { email, password },
    failOnStatusCode: false,
  }).then((res) => {
    expect(res.status).to.eq(200);
    cy.window().then((win) => {
      win.localStorage.setItem('token', res.body.token);
      win.localStorage.setItem('user', JSON.stringify(res.body.user));
    });
  });
});

export {};
