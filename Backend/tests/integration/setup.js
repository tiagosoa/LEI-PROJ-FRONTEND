const { runLocalCommand } = require('../../src/utils/commandExecutor');

jest.mock('../../src/utils/commandExecutor');

const mockVSData = {
    'VS_7_testuser_216': {
        VS_NAME: 'Test Server',
        VS_DESC: 'Test Description',
        VS_STATUS: 'stopped',
        VST_COST: '10',
        VS_HOST: '',
        VS_DTR: '30'
    },
    'VS_2_testuser_217': {
        VS_NAME: 'Docker Server',
        VS_DESC: 'Docker Test',
        VS_STATUS: 'running',
        VST_COST: '5',
        VS_HOST: '192.168.62.213',
        VS_DTR: '15'
    }
};

// Mock do listFolders
runLocalCommand.mockImplementation((command) => {
    if (command.includes('listFolders testuser')) {
        return Promise.resolve('VS_7_testuser_216\nVS_2_testuser_217');
    }
    if (command.includes('listFolders VST')) {
        return Promise.resolve('VST_7_admin_100\nVST_2_admin_101');
    }
    if (command.includes('getCredit')) {
        return Promise.resolve('15');
    }
    if (command.includes('getUsedCredit')) {
        return Promise.resolve('7');
    }
    return Promise.resolve('');
});

module.exports = {
    mockVSData
};