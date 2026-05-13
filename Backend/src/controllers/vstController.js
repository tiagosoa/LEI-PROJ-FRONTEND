const vstService = require('../services/vstService');

/**
 * GET /api/vst
 * Retorna lista de VST disponíveis para utilizadores normais
 */
async function getAvailableVSTs(req, res) {
    try {
        const vstList = await vstService.listAvailableVSTs();
        res.json({
            success: true,
            data: vstList
        });
    } catch (error) {
        console.error('Error in getAvailableVSTs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve templates'
        });
    }
}

/**
 * GET /api/vst/all
 * Retorna TODOS os VST (apenas admin)
 */
async function getAllVSTs(req, res) {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }
        
        const vstList = await vstService.listAllVSTs();
        res.json({
            success: true,
            data: vstList
        });
    } catch (error) {
        console.error('Error in getAllVSTs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve templates'
        });
    }
}

/**
 * GET /api/vst/:folderName
 * Retorna detalhes de um VST específico
 */
async function getVSTDetails(req, res) {
    try {
        const { folderName } = req.params;
        
        // Verificar se o VST existe
        const vstDetails = await vstService.getVSTDetails(folderName);
        
        res.json({
            success: true,
            data: vstDetails
        });
    } catch (error) {
        console.error('Error in getVSTDetails:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve template details'
        });
    }
}

module.exports = {
    getAvailableVSTs,
    getAllVSTs,
    getVSTDetails
};