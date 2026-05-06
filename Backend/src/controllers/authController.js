const ldapService = require('../services/ldapService');
const jwtService = require('../services/jwtService');

/**
 * POST /auth/login
 * Autentica um utilizador e retorna um token JWT
 */
async function login(req, res) {
    try {
        const { username, password } = req.body;
        
        // Validar inputs
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }
        
        // Autenticar via LDAP
        const user = await ldapService.authenticateUser(username, password);
        
        // Gerar token JWT
        const token = jwtService.generateToken(user);
        
        // Responder com sucesso
        res.json({
            success: true,
            data: {
                token,
                user: {
                    username: user.username,
                    isAdmin: user.isAdmin
                }
            }
        });
        
    } catch (error) {
        console.error('Login error:', error.message);
        
        // Tratamento específico para erros de autenticação
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }
        
        // Erros genéricos do servidor
        res.status(500).json({
            success: false,
            error: 'Authentication service unavailable'
        });
    }
}

/**
 * POST /auth/logout
 * (Opcional) Invalida o token no cliente
 * Como usamos JWT stateless, basta o cliente eliminar o token
 */
async function logout(req, res) {
    // JWT não precisa de server-side logout
    // O cliente apenas elimina o token localmente
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
}

/**
 * GET /auth/me
 * Retorna informação do utilizador autenticado
 */
async function getCurrentUser(req, res) {
    // O middleware authenticate já populou req.user
    res.json({
        success: true,
        data: {
            username: req.user.username,
            isAdmin: req.user.isAdmin
        }
    });
}

module.exports = {
    login,
    logout,
    getCurrentUser
};