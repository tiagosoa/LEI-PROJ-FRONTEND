const { runLocalCommand, runRemoteCommandOnNode, getAttribute, getMultipleAttributes, BASE_FOLDER } = require('../utils/commandExecutor');
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
 * Retorna no formato "Número - Designação" (ex: "7 - LXC")
 * @param {number} typeNumber - Número do tipo (ex: 7)
 */
async function getTypeDescription(typeNumber) {
    const now = Date.now();
    if (typeDescriptionCache && typeDescriptionCacheTime && (now - typeDescriptionCacheTime) < CACHE_TTL) {
        const desc = typeDescriptionCache[typeNumber];
        if (desc) {
            return `${typeNumber} - ${desc}`;
        }
        return `${typeNumber} - Unknown Type`;
    }
    
    try {
        const typesPath = `${BASE_FOLDER}/ctl/types`;
        const content = await fs.readFile(typesPath, 'utf8');
        
        const typeMap = {};
        const lines = content.split('\n');
        for (const line of lines) {
            // Formato: "7: LXC" ou "7 LXC"
            const match = line.match(/^(\d+)[:\s\t]+(.+)$/);
            if (match) {
                const num = parseInt(match[1]);
                const desc = match[2].trim();
                typeMap[num] = desc;
            }
        }
        
        typeDescriptionCache = typeMap;
        typeDescriptionCacheTime = now;
        
        const desc = typeMap[typeNumber];
        if (desc) {
            return `${typeNumber} - ${desc}`;
        }
        return `${typeNumber} - Unknown Type`;
    } catch (error) {
        console.log(`Could not read types file, using default for type ${typeNumber}`);
        return `${typeNumber} - Type ${typeNumber}`;
    }
}

async function getCustomAccesses(vsFolder) {
    const customAccesses = [];
    
    for (let i = 1; i <= 25; i++) {
        let desc = await getAttribute(vsFolder, `CUSTOM_ACCESS${i}_DESC`);
        if (desc && desc.trim() !== '') {
            const password = await getAttribute(vsFolder, `CUSTOM_ACCESS${i}_PASS`);
            let enabledDisabled = await getAttribute(vsFolder, `CUSTOM_ACCESS${i}_ENABLED_DISABLED`);
            const passChange = await getAttribute(vsFolder, `CUSTOM_ACCESS${i}_PASS_CHANGE`);
            
            // Limpar a descrição - remover indicações de ENABLED/DISABLED
            desc = desc.replace(/\s*\(?(ENABLED|DISABLED)\)?\s*/gi, '');
            desc = desc.replace(/\s*-\s*(ENABLED|DISABLED)\s*/gi, '');
            desc = desc.trim();
            
            if (!desc) {
                desc = `Access #${i}`;
            }
            
            let enabled = true;
            if (enabledDisabled && enabledDisabled.trim() !== '') {
                enabled = enabledDisabled.trim().toLowerCase() === 'enabled';
            }
            
            customAccesses.push({
                id: i,
                description: desc,
                password: password || null,
                enabled: enabled,
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
    : ['VS_NAME', 'VS_DESC', 'VS_STATUS', 'VST_COST', 'VS_HOST', 'VS_DTR', 'VST_NAME', 'VST_DESC'];  

    
    const attrValues = await getMultipleAttributes(vsFolder, baseAttributes);
    
    // Hard status - executar isRunning no nó correto
    let hardStatus = null;
    const vsHost = attrValues.VS_HOST ? attrValues.VS_HOST.trim() : null;
    
    if (vsHost && vsHost !== '') {
        try {
            // Executar isRunning remotamente no nó onde o VS está a correr
            const remoteCommand = `/ctl/runRemote ${vsHost} ${vsFolder} isRunning`;
            console.log(`Getting hard status from node ${vsHost} for ${vsFolder}`);
            const output = await runLocalCommand(remoteCommand);
            hardStatus = output.trim();
        } catch (error) {
            console.error(`Error getting hard status from ${vsHost}:`, error.message);
            // Se falhar, assumir que não está a correr
            hardStatus = 'stopped';
        }
    } else {
        // Sem host, o VS está parado
        hardStatus = 'stopped';
    }
    
    console.log(`VS ${vsFolder} - Soft: ${attrValues.VS_STATUS}, Hard: ${hardStatus}, Host: ${vsHost}`)
    
    const effectiveCost = await getEffectiveCost(vsFolder, vsHost);
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
        vstName: attrValues.VST_NAME || null,
        vstDescription: attrValues.VST_DESC || null,
        softStatus: attrValues.VS_STATUS?.toLowerCase() || 'stopped',
        hardStatus: hardStatus,
        host: vsHost,
        cost: effectiveCost,
        baseCost: parseInt(attrValues.VST_COST) || 0,
        dtr: parseInt(attrValues.VS_DTR) || 30,
        disabled: isVST ? attrValues.VST_DISABLED === 'YES' : false,
        folderName: vsFolder,
        typeDescription: typeDescription,
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

/**
 * Cria um novo VS a partir de um template
 * @param {string} vstFolderName - Nome da pasta do template (ex: VST_2_sys_2)
 * @param {string} username - Nome do utilizador dono do novo VS
 * @returns {Promise<Object>} - Informação do VS criado
 */
async function createVS(vstFolderName, username) {
    try {
        // Verificar se o template existe
        const vstDetails = await getVSTDetails(vstFolderName);
        
        if (!vstDetails) {
            throw new Error(`Template ${vstFolderName} not found`);
        }
        
        if (vstDetails.disabled) {
            throw new Error(`Template ${vstFolderName} is disabled`);
        }
        
        // Obter lista de VS antes da criação
        const beforeVSList = await getUserVS(username);
        const beforeFolderNames = new Set(beforeVSList.map(vs => vs.folderName));
        
        // Executar comando create
        const command = `/ctl/create ${vstFolderName} ${username}`;
        console.log(`Executing: ${command}`);
        const output = await runLocalCommand(command);
        console.log(`Create command output: "${output}"`);
        
        // Obter lista de VS depois da criação
        const afterVSList = await getUserVS(username);
        
        // Encontrar o VS que foi adicionado
        const newVS = afterVSList.find(vs => !beforeFolderNames.has(vs.folderName));
        
        if (!newVS) {
            // Se não encontrou diferença, tentar obter o VS mais recente
            // Ordenar por ID (assumindo que IDs maiores são mais recentes)
            const sortedVS = [...afterVSList].sort((a, b) => parseInt(b.id) - parseInt(a.id));
            const newestVS = sortedVS[0];
            
            if (newestVS && !beforeFolderNames.has(newestVS.folderName)) {
                return {
                    success: true,
                    folderName: newestVS.folderName,
                    vs: newestVS
                };
            }
            
            throw new Error(`Could not find newly created VS. Before: ${beforeVSList.length}, After: ${afterVSList.length}`);
        }
        
        const vsDetails = await getVSDetails(newVS.folderName, true);
        
        return {
            success: true,
            folderName: newVS.folderName,
            vs: vsDetails
        };
        
    } catch (error) {
        console.error(`Error creating VS from ${vstFolderName} for ${username}:`, error);
        throw error;
    }
}

/**
 * Inicia um VS
 * @param {string} vsFolderName - Nome da pasta do VS
 * @param {string} username - Nome do utilizador (para verificar permissão)
 */
async function startVS(vsFolderName, username) {
    try {
        const vsDetails = await getVSDetails(vsFolderName, false);
        
        if (!vsDetails) {
            throw new Error(`VS ${vsFolderName} not found`);
        }
        
        if (vsDetails.owner !== username) {
            throw new Error(`Access denied. You do not own this virtual server.`);
        }
        
        // Verificar se o VS está parado
        if (vsDetails.softStatus !== 'stopped') {
            throw new Error(`Cannot start VS. Current status: ${vsDetails.softStatus}`);
        }
        const command = `/ctl/start ${vsFolderName}`;
        console.log(`Starting VS: ${command}`);
        
        const output = await runLocalCommand(command);
        console.log(`Start command output: ${output}`);
        
        return {
            success: true,
            message: 'Virtual server started successfully'
        };
        
    } catch (error) {
        console.error(`Error starting VS ${vsFolderName}:`, error);
        throw error;
    }
}

/**
 * Para um VS
 * @param {string} vsFolderName - Nome da pasta do VS
 * @param {string} username - Nome do utilizador (para verificar permissão)
 */
async function stopVS(vsFolderName, username) {
    try {
        const vsDetails = await getVSDetails(vsFolderName, false);
        
        if (!vsDetails) {
            throw new Error(`VS ${vsFolderName} not found`);
        }
        
        if (vsDetails.owner !== username) {
            throw new Error(`Access denied. You do not own this virtual server.`);
        }
        if (vsDetails.softStatus !== 'running' && vsDetails.softStatus !== 'starting') {
            throw new Error(`Cannot stop VS. Current status: ${vsDetails.softStatus}`);
        }
        const command = `/ctl/stop ${vsFolderName}`;
        console.log(`Stopping VS: ${command}`);
        
        const output = await runLocalCommand(command);
        console.log(`Stop command output: ${output}`);
        
        return {
            success: true,
            message: 'Virtual server stopped successfully'
        };
        
    } catch (error) {
        console.error(`Error stopping VS ${vsFolderName}:`, error);
        throw error;
    }
}

/**
 * Elimina um VS
 * @param {string} vsFolderName - Nome da pasta do VS
 * @param {string} username - Nome do utilizador (para verificar permissão)
 */
async function deleteVS(vsFolderName, username) {
    try {
        const vsDetails = await getVSDetails(vsFolderName, false);
        
        if (!vsDetails) {
            throw new Error(`VS ${vsFolderName} not found`);
        }
        
        if (vsDetails.owner !== username) {
            throw new Error(`Access denied. You do not own this virtual server.`);
        }
        if (vsDetails.softStatus !== 'stopped') {
            throw new Error(`Cannot delete VS. Please stop it first. Current status: ${vsDetails.softStatus}`);
        }
        const command = `/ctl/delete ${vsFolderName}`;
        console.log(`Deleting VS: ${command}`);
        
        const output = await runLocalCommand(command);
        console.log(`Delete command output: ${output}`);
        
        return {
            success: true,
            message: 'Virtual server deleted successfully',
            folderName: vsFolderName
        };
        
    } catch (error) {
        console.error(`Error deleting VS ${vsFolderName}:`, error);
        throw error;
    }
}

/**
 * Altera um atributo de um VS
 * @param {string} vsFolderName - Nome da pasta do VS
 * @param {string} username - Nome do utilizador (para verificar permissão)
 * @param {string} attributeName - Nome do atributo
 * @param {string} value - Novo valor
 */
async function setAttribute(vsFolderName, username, attributeName, value) {
    try {
        const vsDetails = await getVSDetails(vsFolderName, false);
        
        if (!vsDetails) {
            throw new Error(`VS ${vsFolderName} not found`);
        }
        
        if (vsDetails.owner !== username) {
            throw new Error(`Access denied. You do not own this virtual server.`);
        }
        
        const editableAttributes = ['VS_NAME', 'VS_DESC'];
        const customAccessMatch = attributeName.match(/^CUSTOM_ACCESS(\d+)_(PASS|ENABLED_DISABLED)$/);
        
        if (!editableAttributes.includes(attributeName) && !customAccessMatch) {
            throw new Error(`Attribute ${attributeName} is not editable`);
        }
        
        if (attributeName.includes('ENABLED_DISABLED')) {
            if (value !== 'enabled' && value !== 'disabled') {
                throw new Error(`ENABLED_DISABLED must be 'enabled' or 'disabled'`);
            }
        }
        
        const base64Value = Buffer.from(value, 'utf8').toString('base64');
        const attributeWithSuffix = `${attributeName}64`;
        
        const node = await getBestNodeForVS(vsFolderName);
        
        const command = `setInfo ${attributeWithSuffix} ${base64Value}`;
        console.log(`Setting attribute: ${command} on node ${node}`);
        
        const output = await runRemoteCommandOnNode(node, vsFolderName, command);
        
        return {
            success: true,
            message: `Attribute ${attributeName} updated successfully`,
            output: output
        };
        
    } catch (error) {
        console.error(`Error setting attribute ${attributeName} for ${vsFolderName}:`, error);
        throw error;
    }
}

/**
 * Obtém o melhor nó para executar um comando num VS
 * @param {string} vsFolderName - Nome da pasta do VS
 */
async function getBestNodeForVS(vsFolderName) {
    try {
        // Primeiro verificar se VS_HOST está definido
        const vsHost = await getAttribute(vsFolderName, 'VS_HOST');
        if (vsHost && vsHost.trim() !== '') {
            console.log(`Using VS_HOST: ${vsHost}`);
            return vsHost.trim();
        }
        
        // Caso contrário, usar getBestNodeForVS
        const output = await runLocalCommand(`/ctl/getBestNodeForVS ${vsFolderName}`);
        const node = output.trim();
        console.log(`getBestNodeForVS returned: ${node}`);
        
        if (!node) {
            // Fallback: usar localhost
            return 'localhost';
        }
        return node;
    } catch (error) {
        console.error(`Error getting best node for ${vsFolderName}:`, error);
        return 'localhost';
    }
}


module.exports = {
    listFolders,
    getVSDetails,
    getUserVS,
    getAllVS,
    parseFolderName,
    getCustomAccesses,
    getNetworkConfig,
    getVSTDetails,
    getTypeDescription,
    createVS,
    startVS,
    stopVS,
    deleteVS,
    setAttribute
};