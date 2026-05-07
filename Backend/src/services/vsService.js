const { runLocalCommand, getAttribute, getMultipleAttributes } = require('../utils/commandExecutor');

/**
 * Lista as pastas de VS/VST de acordo com o argumento fornecido
 * @param {string} listArg - Argumento para listFolders (username, VSALL, VST, etc.)
 */
async function listFolders(listArg = '') {
    const command = `/ctl/listFolders ${listArg}`;
    const output = await runLocalCommand(command);
    return output ? output.split('\n').filter(line => line.trim()) : [];
}

/**
 * Extrai informações do nome da pasta
 */
function parseFolderName(folderName) {
    const parts = folderName.split('_');
    return {
        fullName: folderName,
        prefix: parts[0], // VS or VST
        type: parts[1],
        owner: parts[2],
        id: parts[3]
    };
}

/**
 * Obtém o custo de um VS (considerando se está running)
 */
async function getEffectiveCost(vsFolder, vsHost) {
    const baseCost = await getAttribute(vsFolder, 'VST_COST');
    const cost = parseInt(baseCost) || 0;
    
    // Se estiver running, o custo dobra
    if (vsHost && vsHost.trim() !== '') {
        return cost * 2;
    }
    return cost;
}

/**
 * Obtém detalhes completos de um VS
 */
async function getVSDetails(vsFolder) {
    const folderInfo = parseFolderName(vsFolder);
    const isVST = folderInfo.prefix === 'VST';
    
    const attributes = isVST 
        ? ['VST_NAME', 'VST_DESC', 'VS_STATUS', 'VST_COST', 'VS_HOST', 'VS_DTR', 'VST_DISABLED']
        : ['VS_NAME', 'VS_DESC', 'VS_STATUS', 'VST_COST', 'VS_HOST', 'VS_DTR'];
    
    const attrValues = await getMultipleAttributes(vsFolder, attributes);
    
    // Obter hard status (isRunning) se estiver a correr
    let hardStatus = null;
    if (attrValues.VS_HOST && attrValues.VS_HOST.trim() !== '') {
        try {
            const isRunningOutput = await runLocalCommand(`/${vsFolder}/isRunning`);
            hardStatus = isRunningOutput.trim();
        } catch (error) {
            console.error(`Error getting hard status for ${vsFolder}:`, error);
            hardStatus = 'unknown';
        }
    }
    
    const effectiveCost = await getEffectiveCost(vsFolder, attrValues.VS_HOST);
    
    return {
        id: folderInfo.id,
        type: parseInt(folderInfo.type),
        owner: folderInfo.owner,
        isVST: isVST,
        name: isVST ? attrValues.VST_NAME : attrValues.VS_NAME,
        description: isVST ? attrValues.VST_DESC : attrValues.VS_DESC,
        softStatus: attrValues.VS_STATUS?.toLowerCase() || 'stopped',
        hardStatus: hardStatus,
        host: attrValues.VS_HOST || null,
        cost: effectiveCost,
        baseCost: parseInt(attrValues.VST_COST) || 0,
        dtr: parseInt(attrValues.VS_DTR) || 30,
        disabled: isVST ? attrValues.VST_DISABLED === 'YES' : false,
        folderName: vsFolder
    };
}

/**
 * Obtém a lista de VS do utilizador
 */
async function getUserVS(username) {
    const folders = await listFolders(username);
    const vsList = [];
    
    for (const folder of folders) {
        // Só processar VS (não VST)
        if (folder.startsWith('VS_')) {
            try {
                const vsDetails = await getVSDetails(folder);
                vsList.push(vsDetails);
            } catch (error) {
                console.error(`Error processing folder ${folder}:`, error);
                // Continua com o próximo VS mesmo se um falhar
            }
        }
    }
    
    return vsList;
}

/**
 * Obtém a lista de todos os VS (admin)
 */
async function getAllVS() {
    const folders = await listFolders('VSALL');
    const vsList = [];
    
    for (const folder of folders) {
        if (folder.startsWith('VS_')) {
            try {
                const vsDetails = await getVSDetails(folder);
                vsList.push(vsDetails);
            } catch (error) {
                console.error(`Error processing folder ${folder}:`, error);
            }
        }
    }
    
    return vsList;
}

module.exports = {
    listFolders,
    getVSDetails,
    getUserVS,
    getAllVS,
    parseFolderName
};