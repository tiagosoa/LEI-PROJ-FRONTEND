const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';
process.env.NODE_ENV = 'test';

const JWT_SECRET = process.env.JWT_SECRET;

const generateTestToken = (username = 'testuser', isAdmin = false) => {
    return jwt.sign(
        { username, isAdmin, iat: Math.floor(Date.now() / 1000) },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
};

const generateExpiredToken = (username = 'testuser') => {
    return jwt.sign(
        { username, isAdmin: false, iat: Math.floor(Date.now() / 1000) - 7200 },
        JWT_SECRET,
        { expiresIn: '0s' }
    );
};

const mockVS = {
    id: '216',
    type: 7,
    owner: 'testuser',
    name: 'Test Server',
    description: 'Test Description',
    softStatus: 'stopped',
    folderName: 'VS_7_testuser_216'
};

const mockVST = {
    id: '100',
    type: 7,
    owner: 'admin',
    name: 'Ubuntu Template',
    cost: 10,
    disabled: false,
    folderName: 'VST_7_admin_100'
};

module.exports = {
    generateTestToken,
    generateExpiredToken,
    mockVS,
    mockVST,
    JWT_SECRET
};