describe('VST List E2E Tests', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.get('[formControlName="username"]').type('1231246');
        cy.get('[formControlName="password"]').type('11Julho2005');
        cy.get('button').contains('Login').click();
        cy.url().should('include', '/vs');
    });

    it('should navigate to templates page via menu', () => {
        cy.get('.nav-menu a').contains('Templates').click();
        cy.url().should('include', '/templates');
    });

    it('should display VST list', () => {
        cy.get('.nav-menu a').contains('Templates').click();
        cy.get('.vst-grid').should('be.visible');
        cy.get('.vst-card').should('have.length.at.least', 1);
    });

    it('should display VST information correctly', () => {
        cy.get('.nav-menu a').contains('Templates').click();
        cy.get('.vst-card').first().within(() => {
            cy.get('h3').should('be.visible');
            cy.get('.vst-id').should('be.visible');
            cy.get('.cost-value').should('be.visible');
            cy.get('.value').should('be.visible');
        });
    });

    it('should open description modal', () => {
        cy.get('.nav-menu a').contains('Templates').click();
        cy.get('.description-btn').first().click();
        cy.get('.modal-overlay').should('be.visible');
        cy.get('.modal-header h3').should('be.visible');
        cy.get('.modal-close-btn').click();
        cy.get('.modal-overlay').should('not.exist');
    });
});