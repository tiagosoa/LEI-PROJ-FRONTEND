
const mockVerifyToken = jest.fn();
const mockExtractToken = jest.fn();

jest.mock('../../../src/services/jwtService', () => ({
    verifyToken: mockVerifyToken,
    extractToken: mockExtractToken,
    generateToken: jest.fn()
}));

const { authenticate } = require('../../../src/middleware/authMiddleware');

describe('AuthMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        
        req = {
            headers: {},
            user: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    
        mockVerifyToken.mockReset();
        mockExtractToken.mockReset();
    });

    describe('authenticate', () => {
        it('should return 401 when no token provided', () => {
            mockExtractToken.mockReturnValue(null);
            
            authenticate(req, res, next);
            
            expect(mockExtractToken).toHaveBeenCalledWith(undefined);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. No token provided.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when Authorization header is malformed', () => {
            req.headers.authorization = 'InvalidToken123';
            mockExtractToken.mockReturnValue(null);
            
            authenticate(req, res, next);
            
            expect(mockExtractToken).toHaveBeenCalledWith('InvalidToken123');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. No token provided.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next when valid token provided', () => {
            req.headers.authorization = 'Bearer valid-token';
            const decodedPayload = { username: 'testuser', isAdmin: false };
            
            mockExtractToken.mockReturnValue('valid-token');
            mockVerifyToken.mockReturnValue(decodedPayload);
            
            authenticate(req, res, next);
            
            expect(mockExtractToken).toHaveBeenCalledWith('Bearer valid-token');
            expect(mockVerifyToken).toHaveBeenCalledWith('valid-token');
            expect(req.user).toBeDefined();
            expect(req.user.username).toBe('testuser');
            expect(req.user.isAdmin).toBe(false);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 401 when token is expired', () => {
            req.headers.authorization = 'Bearer expired-token';
            
            mockExtractToken.mockReturnValue('expired-token');
            mockVerifyToken.mockImplementation(() => {
                throw new Error('Token expired');
            });
            
            authenticate(req, res, next);
            
            expect(mockExtractToken).toHaveBeenCalledWith('Bearer expired-token');
            expect(mockVerifyToken).toHaveBeenCalledWith('expired-token');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Token expired'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token is invalid', () => {
            req.headers.authorization = 'Bearer invalid-token';
            
            mockExtractToken.mockReturnValue('invalid-token');
            mockVerifyToken.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            
            authenticate(req, res, next);
            
            expect(mockExtractToken).toHaveBeenCalledWith('Bearer invalid-token');
            expect(mockVerifyToken).toHaveBeenCalledWith('invalid-token');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid token'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle admin user correctly', () => {
            req.headers.authorization = 'Bearer admin-token';
            const decodedPayload = { username: 'admin', isAdmin: true };
            
            mockExtractToken.mockReturnValue('admin-token');
            mockVerifyToken.mockReturnValue(decodedPayload);
            
            authenticate(req, res, next);
            
            expect(req.user.isAdmin).toBe(true);
            expect(next).toHaveBeenCalled();
        });

        it('should handle token with extra spaces correctly', () => {
            req.headers.authorization = 'Bearer   spaced-token  ';
            
            mockExtractToken.mockReturnValue('spaced-token');
            mockVerifyToken.mockReturnValue({ username: 'testuser', isAdmin: false });
            
            authenticate(req, res, next);
            
            expect(mockExtractToken).toHaveBeenCalledWith('Bearer   spaced-token  ');
            expect(next).toHaveBeenCalled();
        });
    });
});