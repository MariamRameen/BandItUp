/// <reference types="cypress" />

describe('Dashboard Tests', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.login(users[0].email, users[0].password).then(() => {
        cy.visit('/dashboard');
      });
    });
  });

    it('Checks sidebar navigation', () => {
   
    cy.contains('Profile', { timeout: 10000 }).should('be.visible').click();
    cy.contains('Profile', { timeout: 5000 }).should('exist'); 
    cy.location('pathname').should('include', '/profile');
    cy.go('back');

    cy.contains('Help & Support', { timeout: 10000 }).should('be.visible').click();
    cy.contains('Help & Support', { timeout: 5000 }).should('exist');
    cy.location('pathname').should('include', '/help');
    cy.go('back');
  })

 
  it('Performs visual regression on charts and progress tracker', () => {
    cy.contains('Overall Band').parent().matchImageSnapshot('overall-band-trajectory');
    cy.contains('Section Performance').parent().matchImageSnapshot('section-performance');
    cy.contains('Goal  Tracker').parent().matchImageSnapshot('goal-progress-tracker');
  });

   it('Quick Actions buttons', () => {
   
    cy.contains('🚀 Weekly Mock Test', { timeout: 15000 }).should('be.visible').click();
    cy.location('pathname').should('include', '/mock-tests/start');
    cy.go('back');

   
    cy.contains('Profile', { timeout: 10000 }).should('be.visible').click();
    cy.location('pathname').should('include', '/profile');
    cy.go('back');
  });

  it("uses find and trigger correctly", () => {
  
  cy.get(".flex-1")               
    .find("button")               
    .should("have.length.greaterThan", 1);

  
  cy.get(".flex-1")
    .find("button")
    .first()
    .trigger("mouseover");

  
  cy.get(".flex-1")
    .find("button")
    .first()
    .trigger("click");

  cy.location("pathname").should("include", "/dashboard");
});


});
