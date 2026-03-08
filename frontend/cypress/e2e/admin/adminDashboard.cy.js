/// <reference types="cypress" />

describe("Admin Dashboard – Overview", () => {

  it("shows admin stats using mocked data", () => {
   
    cy.window().then(win => {
      win.localStorage.setItem('token', 'FAKE-TOKEN-123');
      win.localStorage.setItem('user', JSON.stringify({ email: "admin@banditup.com", role: "admin" }));
    });


    cy.intercept("GET", "http://localhost:4000/api/admin/stats", {
      statusCode: 200,
      body: {
        success: true,
        stats: {
          totalUsers: 100,
          adminUsers: 5,
          premiumUsers: 30,
          freeUsers: 70,
          newUsers: 10,
          academicUsers: 60,
          generalUsers: 40,
          verifiedUsers: 80,
          activeToday: 15
        }
      }
    }).as("mockStats");

    cy.intercept("GET", "http://localhost:4000/api/admin/users", {
      statusCode: 200,
      body: {
        success: true,
        users: [
          { _id: "1", displayName: "Test User 1", email: "test1@example.com", role: "user", subscriptionStatus: "premium", isVerified: true, createdAt: new Date().toISOString() },
          { _id: "2", displayName: "Admin User", email: "admin@example.com", role: "admin", subscriptionStatus: "admin", isVerified: true, createdAt: new Date().toISOString() }
        ]
      }
    }).as("mockUsers");

   
    cy.visit("/admin/dashboard");

  
    cy.wait("@mockStats");
    cy.wait("@mockUsers");

    cy.contains("Total Users").should("exist");
    cy.contains("Admins").should("exist");
    cy.contains("Premium Users").should("exist");
    cy.contains("Active Today").should("exist");

    cy.contains("Test User 1").should("exist");
    cy.contains("Admin User").should("exist");
  });
});
