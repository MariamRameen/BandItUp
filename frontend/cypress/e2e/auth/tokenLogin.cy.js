/// <reference types="cypress" />

describe("Token-Based Login", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("logs in admin via token and navigates to dashboard", () => {
    const users = Cypress.env("users");
    const admin = users.find(u => u.role === "admin");

    cy.loginToken(admin.email, admin.password);

    cy.visit("/admin/dashboard");
    cy.contains("Admin Dashboard").should("exist");
  });

  it("logs in user via token and navigates to dashboard", () => {
    const users = Cypress.env("users");
    const user = users.find(u => u.role === "user");

    cy.loginToken(user.email, user.password);

    cy.visit("/dashboard");
    cy.contains("Welcome back").should("exist");
  });
});
