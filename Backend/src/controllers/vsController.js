const vsService = require('../services/vsService');

/**
 * GET /api/vs
 * Retorna a lista de VS do utilizador autenticado
 */
async function getUserVSList(req, res) {
    try {
        const username = req.user.username;
        const vsList = await vsService.getUserVS(username);
        
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
        // Verificar se é admin
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }
        
        const vsList = await vsService.getAllVS();
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
 * Retorna detalhes de um VS específico
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
        
        const vsDetails = await vsService.getVSDetails(folderName);
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
 * GET /api/vs/:folderName/details
 * Retorna detalhes estendidos de um VS específico (com custom accesses e rede)
 */
async function getVSDetailsExtended(req, res) {
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
        
        const vsDetails = await vsService.getVSDetailsExtended(folderName);
        res.json({
            success: true,
            data: vsDetails
        });
    } catch (error) {
        console.error('Error in getVSDetailsExtended:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve virtual server details'
        });
    }
}

module.exports = {
    getUserVSList,
    getAllVSList,
    getVSDetails,
      // Novo método
};
module.exports = {
    getUserVSList,
    getAllVSList,
    getVSDetails,
    getVSDetailsExtended
};