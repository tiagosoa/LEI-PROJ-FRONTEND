const request = require('supertest');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const authRoutes = require('../../src/routes/authRoutes');
const vsRoutes = require('../../src/routes/vsRoutes');

process.env.JWT_SECRET = 'test-secret-key';

jest.mock('../../src/utils/commandExecutor', () => ({
    runLocalCommand: jest.fn().mockResolvedValue(''),
    runRemoteCommand: jest.fn().mockResolvedValue(''),
    getAttribute: jest.fn().mockResolvedValue(''),
    getMultipleAttributes: jest.fn().mockResolvedValue({
        VS_NAME: 'Test Server',
        VS_STATUS: 'stopped',
        VST_COST: '10',
        VS_DTR: '30'
    })
}));

jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn().mockResolvedValue('7: LXC\n2: Docker')
    }
}));

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/vs', vsRoutes);

describe('Security Tests', () => {
    describe('Authentication Security', () => {
        it('should reject requests without Authorization header', async () => {
            const response = await request(app).get('/api/vs');
            expect(response.status).toBe(401);
        });

        it('should reject requests with malformed Authorization header', async () => {
            const response = await request(app)
                .get('/api/vs')
                .set('Authorization', 'InvalidToken');
            expect(response.status).toBe(401);
        });

        it('should reject expired tokens', async () => {
            const expiredToken = jwt.sign(
                { username: 'testuser', isAdmin: false },
                process.env.JWT_SECRET,
                { expiresIn: '0s' }
            );
            
            const response = await request(app)
                .get('/api/vs')
                .set('Authorization', `Bearer ${expiredToken}`);
            
            expect(response.status).toBe(401);
        });

        it('should reject tampered tokens', async () => {
            const validToken = jwt.sign(
                { username: 'testuser', isAdmin: false },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            const tamperedToken = validToken.slice(0, -5) + 'xxxxx';
            
            const response = await request(app)
                .get('/api/vs')
                .set('Authorization', `Bearer ${tamperedToken}`);
            
            expect(response.status).toBe(401);
        });
    });

    describe('Authorization Security', () => {
        let userToken;

        beforeAll(() => {
            userToken = jwt.sign(
                { username: 'testuser', isAdmin: false },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
        });

        it('should return 401 when trying to access invalid VS folder', async () => {
            // O endpoint de VS details requer autenticação
            // Retorna 401 se o token for inválido, mas com token válido
            // Retorna 500 se o VS não existir (devido ao mock)
            const response = await request(app)
                .get('/api/vs/VS_7_otheruser_999')
                .set('Authorization', `Bearer ${userToken}`);
            
            // Com o mock atual, retorna 500 porque o VS não existe nos mocks
            expect(response.status).toBe(401);
        });
    });

    describe('Brute Force Protection', () => {
        it('should handle multiple failed login attempts gracefully', async () => {
            const attempts = [];
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ username: 'testuser', password: `wrong${i}` });
                attempts.push(response.status);
            }
            expect(attempts.every(status => status === 401)).toBe(true);
        });
    });
});