const jwtService = require('../../../src/services/jwtService');
const jwt = require('jsonwebtoken');

describe('JWT Service', () => {
    describe('generateToken', () => {
        it('should generate a valid token for regular user', () => {
            const user = { username: 'testuser', isAdmin: false };
            const token = jwtService.generateToken(user);
            
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            expect(decoded.username).toBe('testuser');
            expect(decoded.isAdmin).toBe(false);
        });

        it('should generate a valid token for admin user', () => {
            const user = { username: 'admin', isAdmin: true };
            const token = jwtService.generateToken(user);
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            expect(decoded.username).toBe('admin');
            expect(decoded.isAdmin).toBe(true);
        });

        it('should include issued at timestamp', () => {
            const user = { username: 'testuser', isAdmin: false };
            const token = jwtService.generateToken(user);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            expect(decoded.iat).toBeDefined();
            expect(typeof decoded.iat).toBe('number');
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token', () => {
            const user = { username: 'testuser', isAdmin: false };
            const token = jwtService.generateToken(user);
            
            const decoded = jwtService.verifyToken(token);
            expect(decoded.username).toBe('testuser');
        });

        it('should throw error for invalid token', () => {
            expect(() => {
                jwtService.verifyToken('invalid-token');
            }).toThrow('Invalid token');
        });

        it('should throw error for empty token', () => {
            expect(() => {
                jwtService.verifyToken('');
            }).toThrow('Invalid token');
        });

        it('should throw Token expired error for expired token', () => {
            const expiredToken = jwt.sign(
                { username: 'testuser' }, 
                process.env.JWT_SECRET, 
                { expiresIn: '0s' }
            );
            
            expect(() => {
                jwtService.verifyToken(expiredToken);
            }).toThrow('Token expired');
        });
    });

    describe('extractToken', () => {
        it('should extract token from Bearer header', () => {
            const authHeader = 'Bearer my-secret-token-123';
            const token = jwtService.extractToken(authHeader);
            
            expect(token).toBe('my-secret-token-123');
        });

        it('should return null for malformed header', () => {
            const authHeader = 'InvalidHeader';
            const token = jwtService.extractToken(authHeader);
            
            expect(token).toBeNull();
        });

        it('should return null for empty header', () => {
            const token = jwtService.extractToken(null);
            expect(token).toBeNull();
            
            const token2 = jwtService.extractToken('');
            expect(token2).toBeNull();
        });

        it('should trim token value', () => {
            const authHeader = 'Bearer   spaced-token  ';
            const token = jwtService.extractToken(authHeader);
            
            expect(token).toBe('spaced-token');
        });
    });
});