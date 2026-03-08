/// <reference types="cypress" />

describe("Admin Dashboard – Export CSV", () => {
  beforeEach(() => {
    cy.loginToken("admin@banditup.com", "Admin@123");
    cy.visit("/admin/dashboard");

    cy.intercept("GET", "/api/admin/users").as("getUsers");
    cy.intercept("GET", "/api/admin/stats").as("getStats");
    cy.wait("@getUsers");
    cy.wait("@getStats");
  });

  it("triggers CSV download", () => {
    cy.window().then((win) => {
      cy.spy(win.document, 'createElement').as('createElementSpy');
    });

    cy.contains("📥 Export CSV").click();

    cy.get('@createElementSpy').should('have.been.calledWith', 'a');
  });
});
