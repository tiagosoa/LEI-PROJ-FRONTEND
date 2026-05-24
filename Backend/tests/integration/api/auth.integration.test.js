const request = require('supertest');
const express = require('express');
const cors = require('cors');
const authRoutes = require('../../../src/routes/authRoutes');

// Mock do LDAP
jest.mock('../../../src/services/ldapService', () => ({
    authenticateUser: jest.fn((username, password) => {
        if (password === 'correct123') {
            return Promise.resolve({ username, authenticated: true, isAdmin: false });
        }
        if (username === 'admin' && password === 'admin123') {
            return Promise.resolve({ username, authenticated: true, isAdmin: true });
        }
        return Promise.reject(new Error('Invalid credentials'));
    }),
    isAdmin: jest.fn((username) => {
        return Promise.resolve(username === 'admin');
    })
}));

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API Integration Tests', () => {
    describe('POST /api/auth/login', () => {
        it('should return 200 and token for valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'correct123' });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user).toHaveProperty('username', 'testuser');
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'wrong' });
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid username or password');
        });

        it('should return 400 when username is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'password' });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Username and password are required');
        });

        it('should return 400 when password is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser' });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Username and password are required');
        });

        it('should handle admin user correctly', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'admin123' });
            
            expect(response.status).toBe(200);
            expect(response.body.data.user.isAdmin).toBe(true);
        });
    });
});