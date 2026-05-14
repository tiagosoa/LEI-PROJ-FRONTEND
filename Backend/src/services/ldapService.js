const ldap = require('ldapjs');
const config = require('../config/ldap');

/**
 * Autentica um utilizador contra o servidor LDAP
 * @param {string} username - Nome do utilizador (ex: "1234567")
 * @param {string} password - Password do utilizador
 * @returns {Promise<Object>} - Dados do utilizador autenticado
 */
async function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
        // Validar inputs
        if (!username || !password) {
            return reject(new Error('Username and password are required'));
        }

        // Converter username para lowercase (como no sistema atual)
        const normalizedUsername = username.toLowerCase();
        
        // Construir o Distinguished Name (DN) do utilizador
        const userDN = `${config.userAttr}=${normalizedUsername},${config.baseDN}`;
        
        // Criar cliente LDAP com timeout
        const client = ldap.createClient({
            url: config.url,
            timeout: config.timeout || 5000,
            connectTimeout: config.timeout || 5000
        });

        // Tentar bind (autenticação)
        client.bind(userDN, password, (err) => {
            if (err) {
                console.error(`LDAP bind failed for user ${normalizedUsername}:`, err.message);
                client.destroy();
                return reject(new Error('Invalid credentials'));
            }

            // Autenticação bem-sucedida
            console.log(`User ${normalizedUsername} authenticated successfully`);
            client.destroy();
            
            resolve({
                username: normalizedUsername,
                authenticated: true,
                isAdmin: false // Será verificado depois via getCredit
            });
        });
    });
}

/**
 * Verifica se um utilizador é administrador
 * Nota: Esta função pode ser expandida para verificar grupos LDAP
 * @param {string} username - Nome do utilizador
 * @returns {Promise<boolean>}
 */
async function isAdmin(username) {
    try {
        // Por enquanto, usar o mesmo método do sistema atual:
        // Executar /ctl/getCredit e verificar se retorna "admin"
        const { runLocalCommand } = require('../utils/commandExecutor');
        const credit = await runLocalCommand(`/ctl/getCredit ${username}`);
        return credit === 'admin';
    } catch (error) {
        console.error(`Error checking admin status for ${username}:`, error);
        return false;
    }
}

module.exports = {
    authenticateUser,
    isAdmin
};