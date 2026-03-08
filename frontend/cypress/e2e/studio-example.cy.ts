describe('Studio Recording Test', () => {
  it('records interactions', () => {
    cy.visit('/');
    cy.get('#root [name="email"]').click();
    cy.get('#root [name="email"]').type('aisha@gmail.com');
    cy.get('#root [name="password"]').click();
    cy.get('#root [name="password"]').type('aisha2003');
    cy.get('#root button.w-full').click();
    cy.get('#root button.shadow-md').click();
    cy.get('#root a[href="/dashboard"]').click();
    cy.get('#root button.bg-gray-200').click();
    cy.get('#root button.bg-gray-200').click();
    cy.get('#root div.border-t button:nth-child(1)').click();
    cy.get('#root a.flex').click();
    cy.get('#root button.hover\\:bg-red-50').click();
  });
});
