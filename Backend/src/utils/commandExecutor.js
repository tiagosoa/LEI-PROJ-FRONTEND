const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');

const execPromise = util.promisify(exec);
const BASE_FOLDER = process.env.BASE_FOLDER || '/vs_cloud';

/**
 * Executa um comando localmente
 */
async function runLocalCommand(command) {
    try {
        const fullCommand = command.startsWith('/') 
            ? `${BASE_FOLDER}${command}`
            : command;
        
        console.log(`Executing: ${fullCommand}`);
        const { stdout, stderr } = await execPromise(fullCommand);
        
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        
        return stdout.trim();
    } catch (error) {
        console.error(`Error executing command: ${command}`, error);
        throw new Error(`Command failed: ${error.message}`);
    }
}

/**
 * Obtém um atributo de um VS/VST lendo diretamente do ficheiro .attr
 */
async function getAttribute(vsFolder, attributeName) {
    try {
        const attrPath = `${BASE_FOLDER}/${vsFolder}/.attr/${attributeName}`;
        const content = await fs.readFile(attrPath, 'utf8');
        return content.trim();
    } catch (error) {
        return '';
    }
}

/**
 * Obtém múltiplos atributos de uma só vez
 */
async function getMultipleAttributes(vsFolder, attributeNames) {
    const results = {};
    for (const attrName of attributeNames) {
        results[attrName] = await getAttribute(vsFolder, attrName);
    }
    return results;
}

/**
 * Executa um comando remotamente num nó específico
 * @param {string} node - IP do nó
 * @param {string} vsFolder - Nome da pasta do VS
 * @param {string} command - Comando a executar (sem o caminho do VS)
 */
async function runRemoteCommandOnNode(node, vsFolder, command) {
    try {
        const remoteCmd = `/ctl/runRemote ${node} ${vsFolder} ${command}`;
        console.log(`Remote command: ${remoteCmd}`);
        
        const output = await runLocalCommand(remoteCmd);
        return output;
    } catch (error) {
        console.error(`Error running remote command on ${node}:`, error);
        throw error;
    }
}

module.exports = {
    runLocalCommand,
    getAttribute,
    getMultipleAttributes,
    runRemoteCommandOnNode,
    BASE_FOLDER
};