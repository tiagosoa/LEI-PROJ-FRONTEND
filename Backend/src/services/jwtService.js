const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env');
    process.exit(1);
}

/**
 * Gera um token JWT para o utilizador autenticado
 * @param {Object} user - Dados do utilizador { username, isAdmin }
 * @returns {string} - Token JWT
 */
function generateToken(user) {
    const payload = {
        username: user.username,
        isAdmin: user.isAdmin || false,
        iat: Math.floor(Date.now() / 1000) // issued at
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica e decodifica um token JWT
 * @param {string} token - Token JWT
 * @returns {Object} - Payload decodificado
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
        throw new Error('Invalid token');
    }
}

/**
 * Extrai o token do header Authorization
 * @param {string} authHeader - Header Authorization
 * @returns {string|null} - Token ou null
 */
function extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7); // Remove 'Bearer '
}

module.exports = {
    generateToken,
    verifyToken,
    extractToken
};