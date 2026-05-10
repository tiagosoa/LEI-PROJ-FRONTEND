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


async function getCustomAccesses(vsFolder) {
    const customAccesses = [];
    
    for (let i = 1; i <= 25; i++) {
        const desc = await getAttribute(vsFolder, `CUSTOM_ACCESS${i}_DESC`);
        if (desc && desc.trim() !== '') {
            const password = await getAttribute(vsFolder, `CUSTOM_ACCESS${i}_PASS`);
            const enabledDisabled = await getAttribute(vsFolder, `CUSTOM_ACCESS${i}_ENABLED_DISABLED`);
            const passChange = await getAttribute(vsFolder, `CUSTOM_ACCESS${i}_PASS_CHANGE`);
            
            customAccesses.push({
                id: i,
                description: desc,
                password: password || null,
                enabled: !enabledDisabled || enabledDisabled === 'enabled',
                canChangePassword: !!(passChange && passChange.trim() !== ''),
                changeDescription: passChange || null
            });
        }
    }
    
    return customAccesses;
}

async function getNetworkConfig(vsFolder) {
    const networks = ['VNET1', 'VNET2', 'VNET3', 'VNET4'];
    const networkConfigs = [];
    
    for (const net of networks) {
        const ipv4 = await getAttribute(vsFolder, `VS_IP_${net}`);
        const ipv6 = await getAttribute(vsFolder, `VS_IPV6_${net}`);
        const mac = await getAttribute(vsFolder, `VS_MAC_${net}`);
        
        if (ipv4 || ipv6 || mac) {
            networkConfigs.push({
                name: net,
                ipv4: ipv4 || null,
                ipv6: ipv6 || null,
                mac: mac || null
            });
        }
    }
    
    return networkConfigs;
}

async function getVSDetailsExtended(vsFolder) {
    const baseDetails = await getVSDetails(vsFolder);
    
    const additionalAttrs = [
        'VS_TYPE_DESC', 'VS_FIXED_HOST', 'VS_PREF_HOSTS', 'VS_REQUISITES',
        'VS_IP_VNET1', 'VS_IP_VNET2', 'VS_IP_VNET3', 'VS_IP_VNET4',
        'VS_IPV6_VNET1', 'VS_IPV6_VNET2', 'VS_IPV6_VNET3', 'VS_IPV6_VNET4',
        'VS_MAC_VNET1', 'VS_MAC_VNET2', 'VS_MAC_VNET3', 'VS_MAC_VNET4'
    ];
    
    const attrValues = await getMultipleAttributes(vsFolder, additionalAttrs);

    const customAccesses = await getCustomAccesses(vsFolder);
    
    const networkConfigs = await getNetworkConfig(vsFolder);
    
    return {
        ...baseDetails,
        typeDescription: attrValues.VS_TYPE_DESC || `Type ${baseDetails.type}`,
        fixedHost: attrValues.VS_FIXED_HOST || null,
        preferredHosts: attrValues.VS_PREF_HOSTS ? attrValues.VS_PREF_HOSTS.split(' ') : [],
        requisites: attrValues.VS_REQUISITES ? attrValues.VS_REQUISITES.split(' ') : [],
        networkConfigs: networkConfigs,
        customAccesses: customAccesses,
        ipVnet1: attrValues.VS_IP_VNET1 || null,
        ipv6Vnet1: attrValues.VS_IPV6_VNET1 || null,
        macVnet1: attrValues.VS_MAC_VNET1 || null
    };
}


module.exports = {
    listFolders,
    getVSDetails,
    getUserVS,
    getAllVS,
    parseFolderName,
    getCustomAccesses,
    getNetworkConfig,
    getVSDetailsExtended
};