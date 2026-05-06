const { verifyToken, extractToken } = require('../services/jwtService');

/**
 * Middleware para verificar autenticação em routes protegidas
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access denied. No token provided.'
        });
    }
    
    try {
        const decoded = verifyToken(token);
        req.user = decoded; // Adiciona dados do utilizador ao request
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Middleware para verificar se o utilizador é administrador
 */
function requireAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Admin privileges required.'
        });
    }
    next();
}

module.exports = {
    authenticate,
    requireAdmin
};