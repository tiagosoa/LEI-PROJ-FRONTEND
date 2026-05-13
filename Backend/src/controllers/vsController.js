const vsService = require('../services/vsService');
const creditService = require('../services/creditService');

/**
 * GET /api/vs
 * Retorna a lista de VS do utilizador autenticado
 */
async function getUserVSList(req, res) {
    try {
        const username = req.user.username;
        // Para listagem, não precisamos de extended (mais rápido)
        const vsList = await vsService.getUserVS(username, false);
        
        res.json({
            success: true,
            data: vsList
        });
    } catch (error) {
        console.error('Error in getUserVSList:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve virtual servers'
        });
    }
}

/**
 * GET /api/vs/all
 * Retorna todos os VS (apenas admin)
 */
async function getAllVSList(req, res) {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }
        
        const vsList = await vsService.getAllVS(false);
        res.json({
            success: true,
            data: vsList
        });
    } catch (error) {
        console.error('Error in getAllVSList:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve virtual servers'
        });
    }
}

/**
 * GET /api/vs/:folderName
 * Retorna detalhes completos de um VS específico (com extended=true)
 */
async function getVSDetails(req, res) {
    try {
        const { folderName } = req.params;
        const username = req.user.username;
        
        // Verificar se o utilizador é owner ou admin
        const folderInfo = vsService.parseFolderName(folderName);
        const isOwner = folderInfo.owner === username;
        
        if (!isOwner && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You do not own this virtual server.'
            });
        }

        const vsDetails = await vsService.getVSDetails(folderName, true);
        res.json({
            success: true,
            data: vsDetails
        });
    } catch (error) {
        console.error('Error in getVSDetails:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve virtual server details'
        });
    }
}

/**
 * GET /api/vs/credit
 * Retorna o crédito do utilizador autenticado
 */
async function getUserCredit(req, res) {
    try {
        const username = req.user.username;
        const credit = await creditService.getAvailableCredit(username);
        
        res.json({
            success: true,
            data: credit
        });
    } catch (error) {
        console.error('Error in getUserCredit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve credit information'
        });
    }
}

/**
 * POST /api/vs/create
 * Cria um novo VS a partir de um template
 */
async function createVS(req, res) {
    try {
        const { vstFolderName } = req.body;
        const username = req.user.username;
        
        if (!vstFolderName) {
            return res.status(400).json({
                success: false,
                error: 'Template folder name is required'
            });
        }
        
        // Obter detalhes do VST para verificar custo
        const vstDetails = await vsService.getVSTDetails(vstFolderName);
        
        if (!vstDetails) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        
        // Verificar crédito suficiente
        const hasCredit = await creditService.hasSufficientCredit(username, vstDetails.cost);
        
        if (!hasCredit) {
            const credit = await creditService.getAvailableCredit(username);
            return res.status(403).json({
                success: false,
                error: 'Insufficient credit',
                credit: credit
            });
        }
        
        // Criar VS (a lógica está no service)
        const result = await vsService.createVS(vstFolderName, username);
        
        res.json({
            success: true,
            data: {
                folderName: result.folderName,
                vs: result.vs,
                message: 'Virtual server created successfully'
            }
        });
        
    } catch (error) {
        console.error('Error in createVS:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create virtual server: ' + error.message
        });
    }
}

module.exports = {
    getUserVSList,
    getAllVSList,
    getVSDetails,
    getUserCredit,
    createVS         
};