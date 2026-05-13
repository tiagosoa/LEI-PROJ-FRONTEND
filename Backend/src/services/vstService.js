const { runLocalCommand, getMultipleAttributes, BASE_FOLDER } = require('../utils/commandExecutor');
const fs = require('fs').promises;

// Cache para os tipos
let typesCache = null;
let typesCacheTime = null;
const CACHE_TTL = 3600000; // 1 hora

/**
 * Carrega o mapeamento de tipos do ficheiro /vs_cloud/ctl/types
 */
async function loadTypeMapping() {
    const now = Date.now();
    if (typesCache && typesCacheTime && (now - typesCacheTime) < CACHE_TTL) {
        return typesCache;
    }
    
    try {
        const typesPath = `${BASE_FOLDER}/ctl/types`;
        const content = await fs.readFile(typesPath, 'utf8');
        
        const typeMap = {};
        const lines = content.split('\n');
        for (const line of lines) {
            // Formato: "7: LXC" ou "7 LXC" ou "7\tLXC"
            const match = line.match(/^(\d+)[:\s\t]+(.+)$/);
            if (match) {
                const num = parseInt(match[1]);
                const desc = match[2].trim();
                typeMap[num] = desc;
            }
        }
        
        typesCache = typeMap;
        typesCacheTime = now;
        return typeMap;
    } catch (error) {
        console.error('Error loading types file:', error);
        return {};
    }
}

/**
 * Obtém a descrição formatada do tipo (ex: "7 - LXC")
 */
async function getFormattedTypeDescription(typeNumber) {
    const typeMap = await loadTypeMapping();
    const desc = typeMap[typeNumber] || `Type ${typeNumber}`;
    return `${typeNumber} - ${desc}`;
}

/**
 * Lista templates VST disponíveis para utilizadores normais
 */
async function listAvailableVSTs() {
    const command = `/ctl/listFolders VST`;
    const output = await runLocalCommand(command);
    const folders = output ? output.split('\n').filter(line => line.trim()) : [];
    
    const vstList = [];
    for (const folder of folders) {
        if (folder.startsWith('VST_')) {
            try {
                const vstDetails = await getVSTDetails(folder);
                if (!vstDetails.disabled) {
                    vstList.push(vstDetails);
                }
            } catch (error) {
                console.error(`Error processing VST folder ${folder}:`, error);
            }
        }
    }
    
    return vstList;
}

/**
 * Lista TODOS os templates VST (admin)
 */
async function listAllVSTs() {
    const command = `/ctl/listFolders VSTALL`;
    const output = await runLocalCommand(command);
    const folders = output ? output.split('\n').filter(line => line.trim()) : [];
    
    const vstList = [];
    for (const folder of folders) {
        if (folder.startsWith('VST_')) {
            try {
                const vstDetails = await getVSTDetails(folder);
                vstList.push(vstDetails);
            } catch (error) {
                console.error(`Error processing VST folder ${folder}:`, error);
            }
        }
    }
    
    return vstList;
}

/**
 * Obtém detalhes completos de um VST
 */
async function getVSTDetails(vstFolder) {
    const parts = vstFolder.split('_');
    const type = parseInt(parts[1]);
    const owner = parts[2];
    const id = parts[3];
    
    const attributes = [
        'VST_NAME', 'VST_DESC', 'VST_HTML', 'VST_COST', 'VST_DISABLED',
        'VS_STATUS', 'VS_REQUISITES', 'VS_FIXED_HOST'
    ];
    
    const attrValues = await getMultipleAttributes(vstFolder, attributes);
    
    const isDisabled = attrValues.VST_DISABLED === 'YES';
    const formattedTypeDescription = await getFormattedTypeDescription(type);
    const requisites = attrValues.VS_REQUISITES ? attrValues.VS_REQUISITES.split(' ') : [];
    
    return {
        id: id,
        type: type,
        owner: owner,
        name: attrValues.VST_NAME || `Template ${id}`,
        description: attrValues.VST_DESC || 'No description available',
        html: attrValues.VST_HTML || '',
        cost: parseInt(attrValues.VST_COST) || 0,
        disabled: isDisabled,
        softStatus: attrValues.VS_STATUS?.toLowerCase() || 'stopped',
        typeDescription: formattedTypeDescription,  // Agora formato: "7 - LXC"
        requisites: requisites,
        fixedHost: attrValues.VS_FIXED_HOST || null,
        folderName: vstFolder
    };
}

module.exports = {
    listAvailableVSTs,
    listAllVSTs,
    getVSTDetails
};