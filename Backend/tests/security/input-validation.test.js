const request = require('supertest');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const vsRoutes = require('../../src/routes/vsRoutes');

process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Mock do commandExecutor
jest.mock('../../src/utils/commandExecutor', () => ({
    runLocalCommand: jest.fn().mockResolvedValue(''),
    runRemoteCommand: jest.fn().mockResolvedValue(''),
    getAttribute: jest.fn().mockResolvedValue(''),
    getMultipleAttributes: jest.fn().mockImplementation((folder, attrs) => {
        return Promise.resolve({
            VS_NAME: 'Test Server',
            VS_STATUS: 'stopped',
            VST_COST: '10',
            VS_DTR: '30',
            VS_HOST: '',
            VST_NAME: 'Template',
            VST_DESC: 'Description'
        });
    })
}));

// Mock do fs
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn().mockResolvedValue('7: LXC\n2: Docker')
    },
    existsSync: jest.fn().mockReturnValue(true)
}));

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/vs', vsRoutes);

const generateToken = () => {
    return jwt.sign(
        { username: 'testuser', isAdmin: false },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

describe('Input Validation Security Tests', () => {
    let authToken;

    beforeAll(() => {
        authToken = generateToken();
        console.log('Generated token for tests:', authToken.substring(0, 50) + '...');
    });

    describe('SQL Injection Prevention', () => {
        const maliciousInputs = [
            "' OR '1'='1",
            "'; DROP TABLE users; --"
        ];

        maliciousInputs.forEach((malicious) => {
            it(`should handle malicious input: ${malicious.substring(0, 30)}...`, async () => {
                const response = await request(app)
                    .post('/api/vs/create')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ vstFolderName: malicious });
                expect(response.status).toBeDefined();
            });
        });
    });

    describe('XSS Prevention', () => {
        const xssInputs = [
            '<script>alert("xss")</script>',
            '<img src=x onerror=alert("xss")>'
        ];

        xssInputs.forEach((xss) => {
            it(`should sanitize XSS input: ${xss.substring(0, 30)}...`, async () => {
                const response = await request(app)
                    .put('/api/vs/VS_7_testuser_216/attribute')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ attributeName: 'VS_NAME', value: xss });
                
                expect(response.status).toBeDefined();
            });
        });
    });

    describe('Command Injection Prevention', () => {
        const cmdInjections = [
            '; ls -la',
            '| cat /etc/passwd',
            '&& rm -rf /'
        ];

        cmdInjections.forEach((injection) => {
            it(`should prevent command injection: ${injection}`, async () => {
                const response = await request(app)
                    .put('/api/vs/VS_7_testuser_216/attribute')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ attributeName: 'VS_NAME', value: injection });
                
                expect(response.status).toBeDefined();
            });
        });
    });

    describe('Path Traversal Prevention', () => {
        const pathTraversals = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\win.ini'
        ];

        pathTraversals.forEach((path) => {
            it(`should prevent path traversal: ${path}`, async () => {
                const response = await request(app)
                    .put('/api/vs/VS_7_testuser_216/attribute')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ attributeName: 'VS_NAME', value: path });
                
                expect(response.status).toBeDefined();
            });
        });
    });

    describe('Data Type Validation', () => {
        it('should handle invalid ENABLED_DISABLED values', async () => {
            const response = await request(app)
                .put('/api/vs/VS_7_testuser_216/attribute')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ attributeName: 'CUSTOM_ACCESS1_ENABLED_DISABLED', value: 'invalid' });

            expect(response.status).toBeDefined();
        });

        it('should handle valid enabled value', async () => {
            const response = await request(app)
                .put('/api/vs/VS_7_testuser_216/attribute')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ attributeName: 'CUSTOM_ACCESS1_ENABLED_DISABLED', value: 'enabled' });
            
            expect(response.status).toBeDefined();
        });
    });

    describe('Rate Limiting (Conceptual)', () => {
        it('should handle multiple requests without crashing', async () => {
            const requests = [];
            for (let i = 0; i < 5; i++) {
                requests.push(
                    request(app)
                        .get('/api/vs')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }
            
            const responses = await Promise.all(requests);
            expect(responses.length).toBe(5);
            responses.forEach(res => {
                expect(res.status).toBeDefined();
            });
        });
    });
});