describe('Credit Display E2E Tests', () => {
    let authToken: string;

    beforeEach(() => {
        cy.request('POST', '/api/auth/login', {
            username: '1231246',
            password: '11Julho2005'
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.success).to.be.true;
            authToken = response.body.data.token;
        });
    });

    it('should get credit via API', () => {
        cy.request({
            method: 'GET',
            url: '/api/vs/credit',
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        }).then((response) => {
            expect(response.status).to.be.oneOf([200, 304]);
            if (response.status === 200) {
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.have.all.keys('total', 'used', 'available');
                expect(response.body.data.total).to.be.greaterThan(0);
                expect(response.body.data.used).to.be.at.least(0);
                cy.log(`Credit: ${response.body.data.used} / ${response.body.data.total}`);
            } else {
                cy.log('Credit response from cache (304)');
            }
        });
    });

    it('should display credit in UI after login via UI', () => {
        cy.intercept('GET', '/api/vs/credit').as('getCredit');
        
        cy.visit('/');
        
        cy.get('[formControlName="username"]').type('1231246');
        cy.get('[formControlName="password"]').type('11Julho2005');
        cy.get('button').contains('Login').click();
        
        cy.wait('@getCredit', { timeout: 15000 }).then((interception) => {
            cy.log('Credit API response status:', interception.response?.statusCode);
            expect(interception.response?.statusCode).to.be.oneOf([200, 304]);
        });
        
        cy.url({ timeout: 10000 }).should('include', '/vs');
        
        cy.get('.vs-grid', { timeout: 15000 }).should('be.visible');
        
        cy.get('.credit-info', { timeout: 10000 }).should('be.visible');
        cy.get('.credit-info').should(($el) => {
            const text = $el.text();
            expect(text).to.match(/\d+\s*\/\s*\d+/);
            expect(text).not.to.contain('Loading');
        });
    });

    it('should display credit numbers not loading text', () => {
        cy.intercept('GET', '/api/vs/credit').as('getCredit');
        
        cy.visit('/');
        cy.get('[formControlName="username"]').type('1231246');
        cy.get('[formControlName="password"]').type('11Julho2005');
        cy.get('button').contains('Login').click();
        cy.wait('@getCredit', { timeout: 15000 });
        
        cy.url().should('include', '/vs');
        cy.get('.vs-grid', { timeout: 15000 }).should('be.visible');
        
        cy.get('.credit-info').should('be.visible');
        cy.get('.credit-info').invoke('text').then((text) => {
            expect(text).not.to.contain('Loading');
            expect(text).to.match(/\d+/);
        });
    });
});