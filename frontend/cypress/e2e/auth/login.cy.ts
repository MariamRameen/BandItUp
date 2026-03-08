/// <reference types="cypress" />

interface User {
  email: string;
  password: string;
  role: string;
  valid: boolean;
}

describe("Login – Real Backend Tests", () => {

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit("/login");
  });

  
  it("logs in Ayesha and shows user dashboard", () => {
    cy.fixture("users").then((users: User[]) => {
      const user = users.find(u => u.email === "aisha@gmail.com")!;

<<<<<<< HEAD
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
=======
      cy.loginUI(user.email, user.password);

    
      cy.url().should("include", "/dashboard");
      cy.contains("Welcome").should("exist");
>>>>>>> 9224023 (Added vocabulary trainer, chat module, reports, and Cypress updates)
    });
  });


  it("logs in valid users based on role (data-driven)", () => {
    cy.fixture("users").then((users: User[]) => {
      const validUsers = users.filter(u => u.valid);

      cy.wrap(validUsers).each((user: User) => {

        cy.loginUI(user.email, user.password);

        if (user.role === "admin") {
          cy.url().should("include", "/admin/dashboard");
        } else {
          cy.url().should("include", "/dashboard");
        }

       
        cy.window().then(win => {
          win.localStorage.clear();
        });

        cy.visit("/login");
      });
    });
  });

 
  it("shows error message for invalid login", () => {
    cy.fixture("users").then((users: User[]) => {
      const invalidUser = users.find(u => !u.valid)!;

      cy.loginUI(invalidUser.email, invalidUser.password);

      cy.contains(/invalid|incorrect|error/i).should("be.visible");
      cy.url().should("include", "/login");
    });
  });

});
