/// <reference types="cypress" />

describe("Admin Dashboard – Overview", () => {
  beforeEach(() => {
    cy.loginToken("admin@banditup.com", "Admin@123");
    cy.visit("/admin/dashboard");

    cy.intercept("GET", "/api/admin/users").as("getUsers");
    cy.intercept("GET", "/api/admin/stats").as("getStats");

    cy.wait("@getUsers");
    cy.wait("@getStats");
  });

  it("should display admin statistics", () => {
    cy.contains("Total Users").should("exist");
    cy.contains("Admins").should("exist");
    cy.contains("Premium Users").should("exist");
    cy.contains("Active Today").should("exist");
  });
});
