describe('VS Details E2E Tests', () => {
    beforeEach(() => {
        // Login
        cy.visit('/');
        cy.get('[formControlName="username"]').type('1231246');
        cy.get('[formControlName="password"]').type('11Julho2005');
        cy.get('button').contains('Login').click();
        cy.url().should('include', '/vs');
        
        cy.get('.vs-card').first().click();
        cy.url().should('match', /\/vs\/VS_\d+_\d+_\d+/);
        cy.get('.details-header', { timeout: 10000 }).should('be.visible');
    }); 

    describe('Page Layout', () => {
        it('should display VS details page correctly', () => {
            cy.get('.title-section h1').should('be.visible');
            cy.get('.dns-name').should('be.visible');
            cy.get('.dns-name').invoke('text').should('match', /DNS: vs\d+/);
        });

        it('should display status section', () => {
            cy.get('.info-card').first().within(() => {
                cy.contains('Status').should('be.visible');
                cy.contains('Soft Status').should('be.visible');
                cy.contains('Hard Status').should('be.visible');
            });
        });

        it('should display basic information section', () => {
            cy.get('.info-card').eq(1).within(() => {
                cy.contains('Basic Information').should('be.visible');
                cy.contains('Owner').should('be.visible');
                cy.contains('Type').should('be.visible');
                cy.contains('Cost').should('be.visible');
                cy.contains('Days to Run (DTR)').should('be.visible');
                cy.contains('Name').should('be.visible');
            });
        });

        it('should display description section', () => {
            cy.get('.info-card').contains('Description').should('be.visible');
            cy.get('.description-column').should('have.length', 2);
            cy.contains('VS Description (editable)').should('be.visible');
            cy.contains('Original Template Description').should('be.visible');
        });
    });

    describe('Action Buttons', () => {
        it('should have all action buttons visible', () => {
            cy.get('.action-btn.start').should('be.visible');
            cy.get('.action-btn.stop').should('be.visible');
            cy.get('.action-btn.delete').should('be.visible');
            cy.get('.action-btn.reset-dtr').should('be.visible');
        });

        it('should have correct button states based on VS status', () => {
            cy.get('body').then(($body) => {
                const softStatus = $body.find('.status-item .value').first().text().trim();
                
                if (softStatus === 'RUNNING') {
                    cy.get('.action-btn.start').should('be.disabled');
                    cy.get('.action-btn.stop').should('not.be.disabled');
                    cy.get('.action-btn.delete').should('be.disabled');
                } else if (softStatus === 'STOPPED') {
                    cy.get('.action-btn.start').should('not.be.disabled');
                    cy.get('.action-btn.stop').should('be.disabled');
                    cy.get('.action-btn.delete').should('not.be.disabled');
                }
            });
        });

        it('should reset DTR when button is clicked', () => {
            cy.get('.action-btn.reset-dtr').then(($btn) => {
                if (!$btn.is(':disabled')) {
                    const originalDTR = cy.get('.info-row .value').contains('days remaining');
                    cy.get('.action-btn.reset-dtr').click();
                    cy.wait(2000);
                    cy.get('.info-row .value').should('contain', '30 days remaining');
                }
            });
        });
    });

    describe('Edit VS Name', () => {
        it('should edit VS name successfully', () => {
            const newName = `Test VS ${Date.now()}`;
            
            cy.get('.edit-icon').click();
            
            cy.get('.edit-input').should('be.visible');
            
            cy.get('.edit-input').clear().type(newName);
            
            cy.get('.save-icon').click();
            
            cy.wait(2000);
            
            cy.get('.title-section h1').should('contain', newName);
        });

        it('should cancel name edit without saving', () => {
            cy.get('.title-section h1').invoke('text').then((originalName) => {
                cy.get('.edit-icon').click();
                cy.get('.edit-input').clear().type('Temporary Name');
                cy.get('.cancel-icon').click();
                
                cy.get('.title-section h1').should('contain', originalName);
            });
        });
    });

    describe('Edit VS Description', () => {
        it('should edit VS description successfully', () => {
            const newDescription = `Updated description at ${new Date().toLocaleTimeString()}`;
            
            cy.get('.description-column').first().within(() => {
                cy.get('.edit-icon-small').click();
                cy.get('.edit-textarea').should('be.visible');
                cy.get('.edit-textarea').clear().type(newDescription);
                cy.get('.save-btn').click();
            });
            
            cy.wait(2000);
            
            cy.get('.description-column').first().within(() => {
                cy.get('.description-content').should('contain', newDescription);
            });
        });
    });

    describe('Access Methods', () => {
        it('should display access methods if they exist', () => {
            cy.get('body').then(($body) => {
                if ($body.find('.access-item').length > 0) {
                    cy.get('.access-item').should('be.visible');
                }
            });
        });

        it('should toggle access method if toggle button exists', () => {
            cy.get('body').then(($body) => {
                const toggleBtn = $body.find('.toggle-btn');
                if (toggleBtn.length > 0) {
                    const originalStatus = toggleBtn.text().trim();
                    cy.get('.toggle-btn').first().click();
                    cy.wait(2000);
                    
                    cy.get('.toggle-btn').first().should(($newBtn) => {
                        expect($newBtn.text().trim()).not.to.equal(originalStatus);
                    });
                }
            });
        });

        it('should show password if password field exists', () => {
            cy.get('body').then(($body) => {
                if ($body.find('.password-field').length > 0) {
                    cy.get('.password-field input').should('have.attr', 'type', 'password');
                    
                    cy.get('.password-field button').contains('Show').click();
                    cy.get('.password-field input').should('have.attr', 'type', 'text');
                    
                    cy.get('.password-field button').contains('Hide').click();
                    cy.get('.password-field input').should('have.attr', 'type', 'password');
                }
            });
        });

        it('should open password change modal if change button exists', () => {
            cy.get('body').then(($body) => {
                const changeBtn = $body.find('.change-pass-btn');
                if (changeBtn.length > 0) {
                    cy.get('.change-pass-btn').first().click();
                    cy.get('.modal-overlay').should('be.visible');
                    cy.get('.modal-header h3').should('be.visible');
                    
                    cy.get('.modal-close-btn').click();
                    cy.get('.modal-overlay').should('not.exist');
                }
            });
        });
    });

    describe('Start/Stop Operations', () => {
        it('should start a stopped VS', () => {
            cy.get('body').then(($body) => {
                const startBtn = $body.find('.action-btn.start');
                const stopBtn = $body.find('.action-btn.stop');
                
                if (!stopBtn.is(':disabled')) {
                    cy.get('.action-btn.stop').click();
                    cy.wait(3000);
                }
                
                // Agora deve estar parado, o start deve estar habilitado
                cy.get('.action-btn.start').should('not.be.disabled');
                cy.get('.action-btn.start').click();
                cy.wait(3000);
                
                cy.get('.status-item .value').first().should('contain', 'RUNNING');
            });
        });

        it('should stop a running VS', () => {
            cy.get('body').then(($body) => {
                const startBtn = $body.find('.action-btn.start');
                
                if (!startBtn.is(':disabled')) {
                    cy.get('.action-btn.start').click();
                    cy.wait(3000);
                }
                cy.get('.action-btn.stop').should('not.be.disabled');
                cy.get('.action-btn.stop').click();
                cy.wait(3000);
                cy.get('.status-item .value').first().should('contain', 'STOPPED');
            });
        });
    });

    describe('Navigation', () => {
        it('should navigate back to VS list using nav menu', () => {
            cy.get('.nav-menu a').contains('My Virtual Servers').click();
            cy.url().should('include', '/vs');
            cy.get('.vs-grid').should('be.visible');
        });

        it('should navigate to templates and back', () => {
            cy.get('.nav-menu a').contains('Templates').click();
            cy.url().should('include', '/templates');
            cy.get('.vst-grid').should('be.visible');
            
            cy.get('.nav-menu a').contains('My Virtual Servers').click();
            cy.url().should('include', '/vs');
            cy.get('.vs-grid').should('be.visible');
        });
    });
});