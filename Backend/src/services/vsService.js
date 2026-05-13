const { runLocalCommand, getAttribute, getMultipleAttributes, BASE_FOLDER } = require('../utils/commandExecutor');
const fs = require('fs').promises;

let typeDescriptionCache = null;
let typeDescriptionCacheTime = null;
const CACHE_TTL = 3600000; // 1 hora

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
    
    if (vsHost && vsHost.trim() !== '') {
        return cost * 2;
    }
    return cost;
}

/**
 * Obtém a descrição do tipo de VS com cache simples
 * @param {number} typeNumber - Número do tipo (ex: 7)
 */
async function getTypeDescription(typeNumber) {
    const now = Date.now();
    if (typeDescriptionCache && typeDescriptionCacheTime && (now - typeDescriptionCacheTime) < CACHE_TTL) {
        return typeDescriptionCache[typeNumber] || `Type ${typeNumber}`;
    }
    
    try {
        const typesPath = `${BASE_FOLDER}/ctl/types`;
        const content = await fs.readFile(typesPath, 'utf8');
        
        const typeMap = {};
        const lines = content.split('\n');
        for (const line of lines) {
            const match = line.match(/^(\d+)[:\s\t]+(.+)$/);
            if (match) {
                const num = parseInt(match[1]);
                const desc = match[2].trim();
                typeMap[num] = desc;
            }
        }
        
        typeDescriptionCache = typeMap;
        typeDescriptionCacheTime = now;
        
        return typeMap[typeNumber] || `Type ${typeNumber}`;
    } catch (error) {
        console.log(`Could not read types file, using default: ${typeNumber}`);
        return `Type ${typeNumber}`;
    }
}

/**
 * Obtém os custom accesses de um VS
 */
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

/**
 * Obtém as configurações de rede de um VS
 */
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

/**
 * Obtém detalhes completos de um VS
 * @param {string} vsFolder - Nome da pasta do VS
 * @param {boolean} extended - Se true, inclui network configs e custom accesses
 */
async function getVSDetails(vsFolder, extended = false) {
    const folderInfo = parseFolderName(vsFolder);
    const isVST = folderInfo.prefix === 'VST';
    
    // Atributos base
    const baseAttributes = isVST 
        ? ['VST_NAME', 'VST_DESC', 'VS_STATUS', 'VST_COST', 'VS_HOST', 'VS_DTR', 'VST_DISABLED']
        : ['VS_NAME', 'VS_DESC', 'VS_STATUS', 'VST_COST', 'VS_HOST', 'VS_DTR'];
    
    const attrValues = await getMultipleAttributes(vsFolder, baseAttributes);
    
    // Hard status
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
    const typeNumber = parseInt(folderInfo.type);
    let typeDescription = await getTypeDescription(typeNumber);
    
    // Estrutura base do VS
    const vsDetails = {
        id: folderInfo.id,
        type: typeNumber,
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
        folderName: vsFolder,
        typeDescription: typeDescription,
        // Campos para extended details (preenchidos abaixo se necessário)
        fixedHost: null,
        preferredHosts: [],
        requisites: [],
        networkConfigs: [],
        customAccesses: [],
        ipVnet1: null,
        ipv6Vnet1: null,
        macVnet1: null
    };
    if (extended) {
        const additionalAttrs = [
            'VS_FIXED_HOST', 'VS_PREF_HOSTS', 'VS_REQUISITES',
            'VS_IP_VNET1', 'VS_IP_VNET2', 'VS_IP_VNET3', 'VS_IP_VNET4',
            'VS_IPV6_VNET1', 'VS_IPV6_VNET2', 'VS_IPV6_VNET3', 'VS_IPV6_VNET4',
            'VS_MAC_VNET1', 'VS_MAC_VNET2', 'VS_MAC_VNET3', 'VS_MAC_VNET4'
        ];
        
        const additionalValues = await getMultipleAttributes(vsFolder, additionalAttrs);
        
        // Atualizar typeDescription se existir VS_TYPE_DESC
        if (additionalValues.VS_TYPE_DESC && additionalValues.VS_TYPE_DESC.trim() !== '') {
            vsDetails.typeDescription = additionalValues.VS_TYPE_DESC;
        }
        
        vsDetails.fixedHost = additionalValues.VS_FIXED_HOST || null;
        vsDetails.preferredHosts = additionalValues.VS_PREF_HOSTS ? additionalValues.VS_PREF_HOSTS.split(' ') : [];
        vsDetails.requisites = additionalValues.VS_REQUISITES ? additionalValues.VS_REQUISITES.split(' ') : [];
        
        vsDetails.networkConfigs = await getNetworkConfig(vsFolder);
        vsDetails.customAccesses = await getCustomAccesses(vsFolder);
        
        vsDetails.ipVnet1 = additionalValues.VS_IP_VNET1 || null;
        vsDetails.ipv6Vnet1 = additionalValues.VS_IPV6_VNET1 || null;
        vsDetails.macVnet1 = additionalValues.VS_MAC_VNET1 || null;
    }
    
    return vsDetails;
}

/**
 * Obtém a lista de VS do utilizador
 */
async function getUserVS(username, extended = false) {
    const folders = await listFolders(username);
    const vsList = [];
    
    for (const folder of folders) {
        if (folder.startsWith('VS_')) {
            try {
                const vsDetails = await getVSDetails(folder, extended);
                vsList.push(vsDetails);
            } catch (error) {
                console.error(`Error processing folder ${folder}:`, error);
            }
        }
    }
    
    return vsList;
}

/**
 * Obtém a lista de todos os VS (admin)
 */
async function getAllVS(extended = false) {
    const folders = await listFolders('VSALL');
    const vsList = [];
    
    for (const folder of folders) {
        if (folder.startsWith('VS_')) {
            try {
                const vsDetails = await getVSDetails(folder, extended);
                vsList.push(vsDetails);
            } catch (error) {
                console.error(`Error processing folder ${folder}:`, error);
            }
        }
    }
    
    return vsList;
}

/**
 * Obtém detalhes de um VST (necessário para verificar custo)
 */
async function getVSTDetails(vstFolder) {
    const parts = vstFolder.split('_');
    const type = parseInt(parts[1]);
    const owner = parts[2];
    const id = parts[3];
    
    const attributes = ['VST_NAME', 'VST_COST', 'VST_DISABLED'];
    const attrValues = await getMultipleAttributes(vstFolder, attributes);
    
    return {
        id: id,
        type: type,
        owner: owner,
        name: attrValues.VST_NAME || `Template ${id}`,
        cost: parseInt(attrValues.VST_COST) || 0,
        disabled: attrValues.VST_DISABLED === 'YES',
        folderName: vstFolder
    };
}

// Adicionar ao module.exports
module.exports = {
    // ... exports existentes ...
    getVSTDetails  // NOVO
};

module.exports = {
    listFolders,
    getVSDetails,
    getUserVS,
    getAllVS,
    parseFolderName,
    getCustomAccesses,
    getNetworkConfig,
    getTypeDescription
};