describe('Login E2E Tests', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should display login form', () => {
        cy.get('form').should('exist');
        cy.get('[formControlName="username"]').should('be.visible');
        cy.get('[formControlName="password"]').should('be.visible');
        cy.get('button').contains('Login').should('be.visible');
    });

    it('should show error with invalid credentials', () => {
        cy.get('[formControlName="username"]').type('invaliduser');
        cy.get('[formControlName="password"]').type('wrongpassword');
        cy.get('button').contains('Login').click();
        
        cy.get('.error-message').should('be.visible');
    });

    it('should login successfully with valid credentials', () => {
        cy.get('[formControlName="username"]').type('1231246');
        cy.get('[formControlName="password"]').type('11Julho2005');
        cy.get('button').contains('Login').click();
        
        cy.url().should('include', '/vs');
        cy.get('.user-info').should('be.visible');
    });
});