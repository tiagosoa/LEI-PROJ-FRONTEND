const vsService = require('../../../src/services/vsService');
const { runLocalCommand, getAttribute, getMultipleAttributes } = require('../../../src/utils/commandExecutor');
const fs = require('fs').promises;

// Mocks
jest.mock('../../../src/utils/commandExecutor');
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn()
    }
}));

describe('VSService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mocks padrão
        getMultipleAttributes.mockResolvedValue({
            VS_NAME: 'Test Server',
            VS_DESC: 'Test Description',
            VS_STATUS: 'stopped',
            VST_COST: '10',
            VS_HOST: '',
            VS_DTR: '30',
            VST_NAME: 'Ubuntu Template',
            VST_DESC: 'Ubuntu description'
        });
        
        getAttribute.mockResolvedValue('');
        runLocalCommand.mockResolvedValue('');
        fs.readFile.mockResolvedValue('7: LXC\n2: Docker\n1: QEMU/KVM');
    });

    describe('listFolders', () => {
        it('should return list of folders', async () => {
            runLocalCommand.mockResolvedValue('VS_1_user_100\nVS_2_user_101');
            
            const result = await vsService.listFolders('testuser');
            
            expect(result).toEqual(['VS_1_user_100', 'VS_2_user_101']);
            expect(runLocalCommand).toHaveBeenCalledWith('/ctl/listFolders testuser');
        });

        it('should return empty array when no folders', async () => {
            runLocalCommand.mockResolvedValue('');
            
            const result = await vsService.listFolders('testuser');
            
            expect(result).toEqual([]);
        });
    });

    describe('parseFolderName', () => {
        it('should parse VS folder name correctly', () => {
            const result = vsService.parseFolderName('VS_7_testuser_216');
            
            expect(result).toEqual({
                fullName: 'VS_7_testuser_216',
                prefix: 'VS',
                type: '7',
                owner: 'testuser',
                id: '216'
            });
        });

        it('should parse VST folder name correctly', () => {
            const result = vsService.parseFolderName('VST_2_admin_100');
            
            expect(result).toEqual({
                fullName: 'VST_2_admin_100',
                prefix: 'VST',
                type: '2',
                owner: 'admin',
                id: '100'
            });
        });
    });

    describe('getVSDetails', () => {
        it('should return VS details with basic info', async () => {
            const result = await vsService.getVSDetails('VS_7_testuser_216', false);
            
            expect(result).toMatchObject({
                id: '216',
                type: 7,
                owner: 'testuser',
                folderName: 'VS_7_testuser_216',
                name: 'Test Server'
            });
        });

        it('should return extended details when requested', async () => {
            const result = await vsService.getVSDetails('VS_7_testuser_216', true);
            
            expect(result).toHaveProperty('networkConfigs');
            expect(result).toHaveProperty('customAccesses');
        });
    });

    describe('getUserVS', () => {
        it('should return list of user VS', async () => {
            runLocalCommand.mockResolvedValue('VS_7_testuser_216\nVS_2_testuser_217');
            
            const result = await vsService.getUserVS('testuser');
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });

        it('should return empty array when user has no VS', async () => {
            runLocalCommand.mockResolvedValue('');
            
            const result = await vsService.getUserVS('testuser');
            
            expect(result).toEqual([]);
        });

        it('should handle errors gracefully', async () => {
            runLocalCommand.mockRejectedValue(new Error('List failed'));
            
            const result = await vsService.getUserVS('testuser');
        
            expect(result).toEqual([]);
        });
    });

    describe('getAllVS', () => {
        it('should return all VS for admin', async () => {
            runLocalCommand.mockResolvedValue('VS_7_user1_100\nVS_2_user2_101');
            
            const result = await vsService.getAllVS();
            
            expect(result.length).toBe(2);
            expect(runLocalCommand).toHaveBeenCalledWith('/ctl/listFolders VSALL');
        });

        it('should return empty array when no VS exist', async () => {
            runLocalCommand.mockResolvedValue('');
            
            const result = await vsService.getAllVS();
            
            expect(result).toEqual([]);
        });
    });

    describe('getCustomAccesses', () => {
        it('should return custom accesses when they exist', async () => {
            getAttribute.mockImplementation((folder, attr) => {
                if (attr === 'CUSTOM_ACCESS1_DESC') return 'SSH Access';
                if (attr === 'CUSTOM_ACCESS1_PASS') return 'secret123';
                if (attr === 'CUSTOM_ACCESS1_ENABLED_DISABLED') return 'enabled';
                if (attr === 'CUSTOM_ACCESS1_PASS_CHANGE') return 'Change SSH password';
                return '';
            });
            
            const result = await vsService.getCustomAccesses('VS_7_testuser_216');
            
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(1);
            expect(result[0].description).toBe('SSH Access');
            expect(result[0].enabled).toBe(true);
            expect(result[0].canChangePassword).toBe(true);
        });

        it('should return empty array when no custom accesses', async () => {
            getAttribute.mockResolvedValue('');
            
            const result = await vsService.getCustomAccesses('VS_7_testuser_216');
            
            expect(result).toEqual([]);
        });

        it('should handle disabled access correctly', async () => {
            getAttribute.mockImplementation((folder, attr) => {
                if (attr === 'CUSTOM_ACCESS1_DESC') return 'VNC Access';
                if (attr === 'CUSTOM_ACCESS1_ENABLED_DISABLED') return 'disabled';
                return '';
            });
            
            const result = await vsService.getCustomAccesses('VS_7_testuser_216');
            
            expect(result[0].enabled).toBe(false);
        });
    });

    describe('getNetworkConfig', () => {
        it('should return network configs when they exist', async () => {
            const mockNetworkAttrs = {
                'VS_IP_VNET1': '10.9.20.100',
                'VS_IPV6_VNET1': 'fd1e:2bae:c6fd:1009::100',
                'VS_MAC_VNET1': '52:54:00:00:00:01'
            };
            
            getAttribute.mockImplementation((folder, attr) => {
                return mockNetworkAttrs[attr] || '';
            });
            
            const result = await vsService.getNetworkConfig('VS_7_testuser_216');
            
            expect(result.length).toBeGreaterThan(0);
            if (result.length > 0) {
                expect(result[0].name).toBe('VNET1');
                expect(result[0].ipv4).toBe('10.9.20.100');
            }
        });

        it('should return empty array when no network configs', async () => {
            getAttribute.mockResolvedValue('');
            
            const result = await vsService.getNetworkConfig('VS_7_testuser_216');
            
            expect(result).toEqual([]);
        });
    });

    describe('getTypeDescription', () => {
        it('should return type description from cache', async () => {
            const desc1 = await vsService.getTypeDescription(7);
            
            expect(desc1).toContain('7');
            expect(desc1).toContain('LXC');
            
            const desc2 = await vsService.getTypeDescription(7);
            expect(desc2).toBe(desc1);
        });

        it('should return default for unknown type', async () => {
            const result = await vsService.getTypeDescription(99);
            
            expect(result).toContain('99');
        });

        it('should handle file read error', async () => {
            fs.readFile.mockRejectedValue(new Error('File not found'));
            
            const result = await vsService.getTypeDescription(7);
            
            expect(result).toBe('7 - LXC');
        });
    });

    describe('getVSTDetails', () => {
        it('should return VST details for a VS', async () => {
            getMultipleAttributes.mockResolvedValue({
                VST_NAME: 'Ubuntu Template',
                VST_COST: '15',
                VST_DISABLED: ''
            });

            const result = await vsService.getVSTDetails('VS_7_testuser_216');

            expect(result.name).toBe('Ubuntu Template');
            expect(result.cost).toBe(15);
            expect(result.disabled).toBe(false);
        });
    });

    describe('startVS', () => {
        it('should start a stopped VS', async () => {
            getMultipleAttributes.mockResolvedValue({
                VS_STATUS: 'stopped',
                VS_NAME: 'Test Server',
                VS_DESC: 'Test',
                VST_COST: '10',
                VS_HOST: '',
                VS_DTR: '30'
            });
            runLocalCommand.mockResolvedValue('Started');
            
            const result = await vsService.startVS('VS_7_testuser_216', 'testuser');
            
            expect(result.success).toBe(true);
            expect(runLocalCommand).toHaveBeenCalledWith('/ctl/start VS_7_testuser_216');
        });

        it('should throw error when VS not owned by user', async () => {
            getMultipleAttributes.mockResolvedValue({
                VS_STATUS: 'stopped',
                VS_NAME: 'Test Server'
            });
            
            await expect(vsService.startVS('VS_7_otheruser_216', 'testuser'))
                .rejects.toThrow('Access denied');
        });
    });

    describe('stopVS', () => {
        it('should stop a running VS', async () => {
            getMultipleAttributes.mockResolvedValue({
                VS_STATUS: 'running',
                VS_NAME: 'Test Server',
                VS_DESC: 'Test',
                VST_COST: '10',
                VS_HOST: '192.168.62.213',
                VS_DTR: '30'
            });
            runLocalCommand.mockResolvedValue('Stopped');
            
            const result = await vsService.stopVS('VS_7_testuser_216', 'testuser');
            
            expect(result.success).toBe(true);
            expect(runLocalCommand).toHaveBeenCalledWith('/ctl/stop VS_7_testuser_216');
        });
    });

    describe('deleteVS', () => {
        it('should delete a stopped VS', async () => {
            getMultipleAttributes.mockResolvedValue({
                VS_STATUS: 'stopped',
                VS_NAME: 'Test Server',
                VS_DESC: 'Test',
                VST_COST: '10',
                VS_HOST: '',
                VS_DTR: '30'
            });
            runLocalCommand.mockResolvedValue('Deleted');
            
            const result = await vsService.deleteVS('VS_7_testuser_216', 'testuser');
            
            expect(result.success).toBe(true);
            expect(runLocalCommand).toHaveBeenCalledWith('/ctl/delete VS_7_testuser_216');
        });

        it('should throw error when VS is running', async () => {
            getMultipleAttributes.mockResolvedValue({
                VS_STATUS: 'running',
                VS_NAME: 'Test Server'
            });
            
            await expect(vsService.deleteVS('VS_7_testuser_216', 'testuser'))
                .rejects.toThrow('Cannot delete VS. Please stop it first');
        });
    });

    describe('setAttribute', () => {
        beforeEach(() => {
            getMultipleAttributes.mockResolvedValue({
                VS_STATUS: 'stopped',
                VS_NAME: 'Test Server',
                VS_DESC: 'Test Description',
                VST_COST: '10',
                VS_HOST: '',
                VS_DTR: '30'
            });
            runLocalCommand.mockResolvedValue('OK');
        });

        it('should update VS_NAME successfully', async () => {
            const result = await vsService.setAttribute('VS_7_testuser_216', 'testuser', 'VS_NAME', 'New Server Name');

            expect(result.success).toBe(true);
            expect(runLocalCommand).toHaveBeenCalledWith(
                expect.stringMatching(/\/ctl\/setInfo VS_7_testuser_216 VS_NAME64 .+/)
            );
        });

        it('should update CUSTOM_ACCESS ENABLED_DISABLED successfully', async () => {
            const result = await vsService.setAttribute('VS_7_testuser_216', 'testuser', 'CUSTOM_ACCESS1_ENABLED_DISABLED', 'enabled');

            expect(result.success).toBe(true);
            expect(runLocalCommand).toHaveBeenCalledWith('/ctl/setInfo VS_7_testuser_216 CUSTOM_ACCESS1_ENABLED_DISABLED enabled');
        });

        it('should update CUSTOM_ACCESS PASS successfully with base64', async () => {
            const result = await vsService.setAttribute('VS_7_testuser_216', 'testuser', 'CUSTOM_ACCESS1_PASS', 'newPassword123');

            expect(result.success).toBe(true);
            expect(runLocalCommand).toHaveBeenCalledWith(
                expect.stringMatching(/\/ctl\/setInfo VS_7_testuser_216 CUSTOM_ACCESS1_PASS64 .+/)
            );
        });

        it('should throw error for non-editable attribute', async () => {
            await expect(vsService.setAttribute('VS_7_testuser_216', 'testuser', 'VS_STATUS', 'running'))
                .rejects.toThrow('is not editable');
        });

        it('should throw error when user does not own the VS', async () => {
            await expect(vsService.setAttribute('VS_7_otheruser_216', 'testuser', 'VS_NAME', 'New Name'))
                .rejects.toThrow('Access denied');
        });

        it('should validate ENABLED_DISABLED values', async () => {
            await expect(vsService.setAttribute('VS_7_testuser_216', 'testuser', 'CUSTOM_ACCESS1_ENABLED_DISABLED', 'invalid'))
                .rejects.toThrow("ENABLED_DISABLED must be 'enabled' or 'disabled'");
        });
    });
});