/// <reference types="cypress" />

describe("Admin Users – Data Driven Search", () => {
  before(() => {
    cy.fixture("searchData").as("searchData");
  });

  beforeEach(() => {
    cy.loginToken("admin@banditup.com", "Admin@123");

    cy.intercept("GET", "http://localhost:4000/api/admin/users").as("getUsers");
    cy.intercept("GET", "http://localhost:4000/api/admin/stats").as("getStats");

    cy.visit("/admin/dashboard");

    cy.wait("@getUsers");
    cy.wait("@getStats");

    cy.contains("👥 User Management").click();
  });

  it("filters users using search keywords", function () {
    this.searchData.forEach((item: { keyword: string }) => {
      cy.get('input[placeholder="Search by name or email..."]')
        .clear()
        .type(item.keyword);

      cy.wait(300);

      cy.get("tbody tr").should("have.length.greaterThan", 0);
    });
  });
});
