// Ignorar erros não tratados
Cypress.on('uncaught:exception', (err, runnable) => {
    if (err.message.includes('Angular') || 
        err.message.includes('Zone') ||
        err.message.includes('inject')) {
        return false;
    }
    return true;
});

// Comando customizado para login
Cypress.Commands.add('login', (username, password) => {
    cy.visit('/');
    cy.get('[formControlName="username"]').type(username);
    cy.get('[formControlName="password"]').type(password);
    cy.get('button').contains('Login').click();
    cy.url({ timeout: 10000 }).should('include', '/vs');
    // Aguardar crédito carregar
    cy.get('.credit-info', { timeout: 10000 }).should('be.visible');
});

// Comando customizado para esperar crédito
Cypress.Commands.add('waitForCredit', () => {
    cy.get('.credit-info', { timeout: 10000 }).should('be.visible');
    cy.get('.credit-value', { timeout: 5000 }).should('be.visible');
});