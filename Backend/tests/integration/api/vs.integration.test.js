const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { generateTestToken, JWT_SECRET } = require('../../helpers/testHelper');

const authRoutes = require('../../../src/routes/authRoutes');
const vsRoutes = require('../../../src/routes/vsRoutes');

jest.mock('../../../src/services/vsService', () => ({
    getUserVS: jest.fn().mockResolvedValue([
        { id: '216', name: 'Test Server', softStatus: 'stopped', folderName: 'VS_7_testuser_216' }
    ]),
    getAvailableCredit: jest.fn().mockResolvedValue({ total: 15, used: 7, available: 8 })
}));

jest.mock('../../../src/middleware/authMiddleware', () => ({
    authenticate: (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }
        req.user = { username: 'testuser', isAdmin: false };
        next();
    }
}));

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/vs', vsRoutes);

describe('VS API Integration Tests', () => {
    let authToken;

    beforeAll(() => {
        authToken = generateTestToken('testuser', false);
        console.log('Generated token:', authToken);
    });

    describe('GET /api/vs', () => {
        it('should return 401 without token', async () => {
            const response = await request(app).get('/api/vs');
            expect(response.status).toBe(401);
        });

        it('should return 200 with valid token', async () => {
            const response = await request(app)
                .get('/api/vs')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
        });
    });

    describe('GET /api/vs/credit', () => {
        it('should return 401 without token', async () => {
            const response = await request(app).get('/api/vs/credit');
            expect(response.status).toBe(401);
        });

        it('should return credit information with valid token', async () => {
            const response = await request(app)
                .get('/api/vs/credit')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(response.status).toBe(200);
        });
    });
});