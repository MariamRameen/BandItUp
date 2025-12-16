describe("Admin – Update User Role", () => {
  beforeEach(() => {
    cy.loginToken("admin@banditup.com", "Admin@123");
    cy.visit("/admin/dashboard");
    cy.contains("👥 User Management").click();
    cy.intercept("PUT", "/api/admin/users/*/role").as("updateRole");
  });

  it("updates a non-admin user role", () => {
    cy.get("tbody tr")
      .contains("Make Admin")
      .first()
      .click();

    cy.on("window:confirm", () => true);
    cy.wait("@updateRole").its("response.statusCode").should("eq", 200);
  });
});
