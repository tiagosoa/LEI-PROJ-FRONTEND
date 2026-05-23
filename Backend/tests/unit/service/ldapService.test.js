const ldapService = require('../../../src/services/ldapService');
const ldap = require('ldapjs');

// Mock do ldapjs
jest.mock('ldapjs');

// Mock do commandExecutor para isAdmin
jest.mock('../../../src/utils/commandExecutor', () => ({
    runLocalCommand: jest.fn()
}));

describe('LDAP Service', () => {
    let mockClient;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        mockClient = {
            bind: jest.fn(),
            destroy: jest.fn(),
            search: jest.fn()
        };
        
        ldap.createClient.mockReturnValue(mockClient);
    });

    describe('authenticateUser', () => {
        it('should successfully authenticate valid user', async () => {
            mockClient.bind.mockImplementation((dn, password, callback) => {
                callback(null);
            });
            
            const result = await ldapService.authenticateUser('testuser', 'correctpassword');
            
            expect(result).toEqual({
                username: 'testuser',
                authenticated: true,
                isAdmin: false
            });
            
            expect(mockClient.bind).toHaveBeenCalledTimes(1);
            expect(mockClient.bind).toHaveBeenCalledWith(
                expect.stringContaining('uid=testuser'),
                'correctpassword',
                expect.any(Function)
            );
            expect(mockClient.destroy).toHaveBeenCalled();
        });

        it('should convert username to lowercase', async () => {
            mockClient.bind.mockImplementation((dn, password, callback) => {
                callback(null);
            });
            
            const result = await ldapService.authenticateUser('TESTUSER', 'password');
            
            expect(result.username).toBe('testuser');
            expect(mockClient.bind).toHaveBeenCalledWith(
                expect.stringContaining('uid=testuser'),
                'password',
                expect.any(Function)
            );
        });

        it('should reject with error for invalid credentials', async () => {
            mockClient.bind.mockImplementation((dn, password, callback) => {
                callback(new Error('Invalid credentials'));
            });
            
            await expect(ldapService.authenticateUser('testuser', 'wrongpassword'))
                .rejects.toThrow('Invalid credentials');
            
            expect(mockClient.destroy).toHaveBeenCalled();
        });

        it('should reject when username is empty', async () => {
            await expect(ldapService.authenticateUser('', 'password'))
                .rejects.toThrow('Username and password are required');
        });

        it('should reject when password is empty', async () => {
            await expect(ldapService.authenticateUser('testuser', ''))
                .rejects.toThrow('Username and password are required');
        });

        it('should reject when both username and password are empty', async () => {
            await expect(ldapService.authenticateUser('', ''))
                .rejects.toThrow('Username and password are required');
        });

        it('should handle LDAP connection error - transforms to Invalid credentials', async () => {
            mockClient.bind.mockImplementation((dn, password, callback) => {
                callback(new Error('LDAP server unreachable'));
            });
            
            await expect(ldapService.authenticateUser('testuser', 'password'))
                .rejects.toThrow('Invalid credentials');
        });
    });

    describe('isAdmin', () => {
        const { runLocalCommand } = require('../../../src/utils/commandExecutor');

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should return true for admin user', async () => {
            runLocalCommand.mockResolvedValue('admin');
            
            const result = await ldapService.isAdmin('adminuser');
            
            expect(result).toBe(true);
            expect(runLocalCommand).toHaveBeenCalledWith('/ctl/getCredit adminuser');
        });

        it('should return false for non-admin user', async () => {
            runLocalCommand.mockResolvedValue('15');
            
            const result = await ldapService.isAdmin('regularuser');
            
            expect(result).toBe(false);
        });

        it('should return false on error', async () => {
            runLocalCommand.mockRejectedValue(new Error('Command failed'));
            
            const result = await ldapService.isAdmin('testuser');
            
            expect(result).toBe(false);
        });
    });

    describe('LDAP client configuration', () => {
        it('should create LDAP client with correct configuration', async () => {
            mockClient.bind.mockImplementation((dn, password, callback) => {
                callback(null);
            });
            
            await ldapService.authenticateUser('testuser', 'password');
            
            expect(ldap.createClient).toHaveBeenCalledTimes(1);
            expect(ldap.createClient).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: expect.any(String),
                    timeout: expect.any(Number),
                    connectTimeout: expect.any(Number)
                })
            );
        });
    });
});