describe('VS List E2E Tests', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.get('[formControlName="username"]').type('1231246');
        cy.get('[formControlName="password"]').type('11Julho2005');
        cy.get('button').contains('Login').click();
        cy.url().should('include', '/vs');
    });

    it('should display VS list', () => {
        cy.get('.vs-grid').should('be.visible');
        cy.get('.vs-card').should('have.length.at.least', 1);
    });

    it('should display VS information correctly', () => {
        cy.get('.vs-card').first().within(() => {
            cy.get('h3').should('be.visible');  // Nome do VS
            cy.get('.vs-id').should('be.visible');  // ID
            cy.get('.status-badge').should('be.visible');  // Status
            cy.get('.cost-value').should('be.visible');  // Costo
            cy.get('.dtr-cell, .vs-dtr .value').should('be.visible');  // DTR
        });
    });

    it('should view VS details when clicking on card', () => {
        cy.get('.vs-card').first().click();
        cy.url().should('match', /\/vs\/VS_\d+_\d+_\d+/);
        cy.get('.details-header h1').should('be.visible');
        cy.get('.info-card').should('have.length.at.least', 3);
    });
});