// Configurar ambiente de teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.LDAP_URL = 'ldap://test.local';
process.env.BASE_FOLDER = '/mock/vs_cloud';
process.env.LDAP_BASE_DN = 'ou=users,dc=test,dc=local';
process.env.LDAP_USER_ATTR = 'uid';

// Mock do commandExecutor
jest.mock('../../src/utils/commandExecutor', () => ({
    runLocalCommand: jest.fn(),
    runRemoteCommand: jest.fn(),
    getAttribute: jest.fn(),
    getMultipleAttributes: jest.fn(),
    BASE_FOLDER: '/mock/vs_cloud'
}));

// Mock do fs
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        access: jest.fn()
    },
    existsSync: jest.fn(() => true),
    readFileSync: jest.fn(() => '7: LXC\n2: Docker\n1: QEMU/KVM')
}));

// Mock do ldapjs
jest.mock('ldapjs', () => ({
    createClient: jest.fn(() => ({
        bind: (dn, password, callback) => {
            if (password === 'correct' || password === '11Julho2005') {
                callback(null);
            } else {
                callback(new Error('Invalid credentials'));
            }
        },
        destroy: jest.fn()
    }))
}));

global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
};