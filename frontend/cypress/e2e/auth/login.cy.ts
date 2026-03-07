/// <reference types="cypress" />



interface User {
  email: string;
  password: string;
  role?: string;
}

describe("Login Tests", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("logs in with a single valid credential", () => {
    const users: User[] = Cypress.env("users");
    const user = users[0]; 

    cy.loginUI(user.email, user.password); 

    cy.url().should("include", "/dashboard");
    if (user.role === "admin")
      cy.contains("Admin Dashboard").should("exist");
    else
      cy.contains("Welcome back").should("exist");
  });

  it("logs in with multiple users (data-driven)", () => {
    const users: User[] = Cypress.env("users");

    users.forEach((user: User) => {
      const isAdmin = user.role === "admin";

      if (isAdmin) {
        cy.intercept("GET", "**/api/admin/users").as("getAdminUsers");
        cy.intercept("GET", "**/api/admin/stats").as("getAdminStats");
      } else {
        cy.intercept("GET", "**/api/profile/me").as("getProfile");
      }

     
      cy.loginUI(user.email, user.password);

      
      if (isAdmin) {
        cy.wait("@getAdminUsers", { timeout: 10000 })
          .its("response.statusCode")
          .should("eq", 200);

        cy.wait("@getAdminStats", { timeout: 10000 })
          .its("response.statusCode")
          .should("be.oneOf", [200, 304]);

        cy.url({ timeout: 10000 }).should("include", "/admin/dashboard");
        cy.contains("Admin Dashboard", { timeout: 10000 }).should("exist");
      } else {
        cy.wait("@getProfile", { timeout: 10000 }).its("response.statusCode").should("eq", 200);

        cy.url({ timeout: 10000 }).should("include", "/dashboard");
        cy.contains("Welcome back", { timeout: 10000 }).should("exist");
      }

     
      cy.get('button:contains("Logout")').click();
      cy.clearLocalStorage();
      cy.clearCookies();
      cy.visit("/login");
    });
  });
});
