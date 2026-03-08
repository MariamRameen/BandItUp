/// <reference types="cypress" />

describe("Admin Dashboard – Tab Switching", () => {
  beforeEach(() => {
    cy.loginToken("admin@banditup.com", "Admin@123");
    cy.visit("/admin/dashboard");

    cy.intercept("GET", "/api/admin/users").as("getUsers");
    cy.intercept("GET", "/api/admin/stats").as("getStats");
    cy.wait("@getUsers");
    cy.wait("@getStats");
  });

  it("switches from Overview to Users tab", () => {
  cy.contains("Total Users").should("exist");
  cy.contains("Admins").should("exist");

  cy.contains("👥 User Management").click();
  cy.wait("@getUsers");

  cy.get('table tbody tr').should('exist');
  cy.get('input[placeholder="Search by name or email..."]').should("exist");
});

  it("switches from Users to Analytics tab", () => {
    cy.contains("👥 User Management").click();
    cy.contains("📈 Analytics").click();

    cy.contains("User Growth").should("exist");
    cy.contains("Activity Overview").should("exist");
  });
});
