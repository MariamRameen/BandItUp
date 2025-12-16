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
    // Profile link
    cy.contains('Profile', { timeout: 10000 }).should('be.visible').click();
    cy.contains('Profile', { timeout: 5000 }).should('exist'); 
    cy.location('pathname').should('include', '/profile');
    cy.go('back');

    // Help & Support 
    cy.contains('Help & Support', { timeout: 10000 }).should('be.visible').click();
    cy.contains('Help & Support', { timeout: 5000 }).should('exist');
    cy.location('pathname').should('include', '/help');
    cy.go('back');
  })

  //  Visual regression 
  it('Performs visual regression on charts and progress tracker', () => {
    cy.contains('Overall Band Trajectory').parent().matchImageSnapshot('overall-band-trajectory');
    cy.contains('Section Performance').parent().matchImageSnapshot('section-performance');
    cy.contains('Goal Progress Tracker').parent().matchImageSnapshot('goal-progress-tracker');
  });

   it('Quick Actions buttons', () => {
    // Weekly Mock Test
    cy.contains('🚀 Weekly Mock Test', { timeout: 15000 }).should('be.visible').click();
    cy.location('pathname').should('include', '/mock-tests/start');
    cy.go('back');

    // Profile button
    cy.contains('Profile', { timeout: 10000 }).should('be.visible').click();
    cy.location('pathname').should('include', '/profile');
    cy.go('back');
  });
});
