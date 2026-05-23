import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'https://vs-ctl2.dei.isep.ipp.pt',  
        supportFile: 'cypress/support/e2e.ts',
        specPattern: 'cypress/e2e/**/*.cy.ts',
        viewportWidth: 1280,
        viewportHeight: 720,
        video: false,
        screenshotOnRunFailure: true,
        defaultCommandTimeout: 10000, 
        pageLoadTimeout: 30000
    }
});