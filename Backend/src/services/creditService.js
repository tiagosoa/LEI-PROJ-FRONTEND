const { runLocalCommand } = require('../utils/commandExecutor');

/**
 * Obtém o crédito total do utilizador
 * @param {string} username - Nome do utilizador
 */
async function getUserCredit(username) {
    try {
        const output = await runLocalCommand(`/ctl/getCredit ${username}`);
        const credit = parseInt(output);
        
        if (isNaN(credit)) {
            if (output === 'admin' || output === 'prof' || output === 'staff') {
                return 10000;
            }
            return 15; // default credit
        }
        
        return credit;
    } catch (error) {
        console.error(`Error getting credit for ${username}:`, error);
        return 15; // default credit on error
    }
}

/**
 * Obtém o crédito usado pelo utilizador (soma dos custos dos seus VS)
 * @param {string} username - Nome do utilizador
 */
async function getUsedCredit(username) {
    try {
        const output = await runLocalCommand(`/ctl/getUsedCredit ${username}`);
        const credit = parseInt(output);
        return isNaN(credit) ? 0 : credit;
    } catch (error) {
        console.error(`Error getting used credit for ${username}:`, error);
        return 0;
    }
}

/**
 * Obtém o crédito disponível (total - usado)
 */
async function getAvailableCredit(username) {
    const total = await getUserCredit(username);
    const used = await getUsedCredit(username);
    return {
        total: total,
        used: used,
        available: total - used
    };
}

/**
 * Verifica se o utilizador tem crédito suficiente para criar um VS
 * @param {string} username - Nome do utilizador
 * @param {number} vstCost - Custo do template
 */
async function hasSufficientCredit(username, vstCost) {
    const credit = await getAvailableCredit(username);
    return credit.available >= vstCost;
}

module.exports = {
    getUserCredit,
    getUsedCredit,
    getAvailableCredit,
    hasSufficientCredit
};