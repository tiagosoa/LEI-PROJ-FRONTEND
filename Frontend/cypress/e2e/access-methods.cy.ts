describe('Access Methods E2E Tests', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.get('[formControlName="username"]').type('1231246');
        cy.get('[formControlName="password"]').type('11Julho2005');
        cy.get('button').contains('Login').click();
        cy.url().should('include', '/vs');
        cy.get('.vs-card').first().click();
    });

    it('should display access methods', () => {
        cy.get('.access-item').should('be.visible');
    });

    it('should toggle access method', () => {
        cy.get('.toggle-btn').first().then(($btn) => {
            const originalText = $btn.text();
            cy.wrap($btn).click();
            cy.wait(1000);
            cy.wrap($btn).should(($newBtn) => {
                expect($newBtn.text()).not.to.equal(originalText);
            });
        });
    });

    it('should show/hide password', () => {
        cy.get('body').then(($body) => {
            if ($body.find('.password-field:visible').length > 0) {
                cy.get('.password-field button').contains('Show').click();
                cy.get('.password-field input').should('have.attr', 'type', 'text');
                cy.get('.password-field button').contains('Hide').click();
                cy.get('.password-field input').should('have.attr', 'type', 'password');
            } else {
                cy.log('No password fields found - skipping test');
            }
        });
    }); 

    it('should copy password', () => {
        cy.get('body').then(($body) => {
            if ($body.find('.password-field:visible').length > 0) {
                cy.get('.password-field button').contains('Copy').click();
                cy.on('window:alert', (text) => {
                    expect(text).to.contain('Password copied');
                });
            } else {
                cy.log('No password fields found - skipping test');
            }
        });
    });

    it('should not show password buttons when access is disabled', () => {
        cy.get('.access-status.disabled').first().then(($disabledAccess) => {
            cy.wrap($disabledAccess).closest('.access-item').within(() => {
                cy.get('.password-field').should('not.exist');
                cy.get('.change-pass-btn').should('not.exist');
            });
        });
    });
});