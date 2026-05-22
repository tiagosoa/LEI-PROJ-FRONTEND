const vstService = require('../../../src/services/vstService');
const { runLocalCommand, getMultipleAttributes } = require('../../../src/utils/commandExecutor');
const fs = require('fs').promises;

jest.mock('../../../src/utils/commandExecutor');
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn()
    }
}));

describe('VST Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fs.readFile.mockResolvedValue('7: LXC\n2: Docker\n1: QEMU/KVM');
    });

    const mockVSTFolders = ['VST_7_admin_100', 'VST_2_admin_101', 'VST_1_admin_102'];
    const mockVSTDetails = {
        VST_NAME: 'Ubuntu 22.04 LXC',
        VST_DESC: 'Ubuntu 22.04 template',
        VST_HTML: '<img src="ubuntu.png">',
        VST_COST: '10',
        VST_DISABLED: '',
        VS_STATUS: 'stopped',
        VS_REQUISITES: 'linux networking',
        VS_FIXED_HOST: ''
    };

    describe('listAvailableVSTs', () => {
        it('should return only enabled VSTs', async () => {
            runLocalCommand.mockResolvedValue(mockVSTFolders.join('\n'));
            getMultipleAttributes.mockResolvedValue(mockVSTDetails);

            const result = await vstService.listAvailableVSTs();

            expect(Array.isArray(result)).toBe(true);
            expect(runLocalCommand).toHaveBeenCalledWith('/ctl/listFolders VST');
        });

        it('should return empty array when no VSTs', async () => {
            runLocalCommand.mockResolvedValue('');

            const result = await vstService.listAvailableVSTs();

            expect(result).toEqual([]);
        });

        it('should skip disabled VSTs', async () => {
            runLocalCommand.mockResolvedValue('VST_7_admin_100\nVST_2_admin_101');
            
            // Primeiro VST disabled
            getMultipleAttributes.mockResolvedValueOnce({
                ...mockVSTDetails,
                VST_DISABLED: 'YES'
            });
            // Segundo VST enabled
            getMultipleAttributes.mockResolvedValueOnce(mockVSTDetails);

            const result = await vstService.listAvailableVSTs();

            expect(result.length).toBe(1);
            expect(result[0].disabled).toBe(false);
        });

        it('should skip folders that fail to process', async () => {
            runLocalCommand.mockResolvedValue('VST_7_admin_100\nVST_invalid_folder');
            getMultipleAttributes.mockResolvedValueOnce(mockVSTDetails);
            getMultipleAttributes.mockRejectedValueOnce(new Error('Invalid folder'));

            const result = await vstService.listAvailableVSTs();
            expect(result.length).toBe(1);
        });
    });

    describe('listAllVSTs', () => {
        it('should return all VSTs including disabled', async () => {
            runLocalCommand.mockResolvedValue('VST_7_admin_100\nVST_2_admin_101');
            getMultipleAttributes.mockResolvedValue(mockVSTDetails);

            const result = await vstService.listAllVSTs();

            expect(result.length).toBe(2);
            expect(runLocalCommand).toHaveBeenCalledWith('/ctl/listFolders VSTALL');
        });

        it('should return empty array when no VSTs', async () => {
            runLocalCommand.mockResolvedValue('');

            const result = await vstService.listAllVSTs();

            expect(result).toEqual([]);
        });

        it('should handle command error gracefully and return empty array', async () => {
            runLocalCommand.mockRejectedValue(new Error('Command failed'));

            const result = await vstService.listAllVSTs();
            expect(result).toEqual([]);
        });

        it('should skip folders that fail to process', async () => {
            runLocalCommand.mockResolvedValue('VST_7_admin_100\nVST_invalid_folder');
            getMultipleAttributes.mockResolvedValueOnce(mockVSTDetails);
            getMultipleAttributes.mockRejectedValueOnce(new Error('Invalid folder'));

            const result = await vstService.listAllVSTs();

            expect(result.length).toBe(1);
        });
    });

    describe('getVSTDetails', () => {
        beforeEach(() => {
            getMultipleAttributes.mockResolvedValue(mockVSTDetails);
        });

        it('should return VST details correctly', async () => {
            const result = await vstService.getVSTDetails('VST_7_admin_100');

            expect(result).toMatchObject({
                id: '100',
                type: 7,
                owner: 'admin',
                name: 'Ubuntu 22.04 LXC',
                cost: 10,
                disabled: false,
                folderName: 'VST_7_admin_100'
            });
        });

        it('should have formatted type description', async () => {
            const result = await vstService.getVSTDetails('VST_7_admin_100');

            expect(result.typeDescription).toContain('7');
            expect(result.typeDescription).toContain('LXC');
        });

        it('should handle disabled VST', async () => {
            getMultipleAttributes.mockResolvedValue({
                ...mockVSTDetails,
                VST_DISABLED: 'YES'
            });

            const result = await vstService.getVSTDetails('VST_7_admin_100');

            expect(result.disabled).toBe(true);
        });

        it('should use default values when attributes missing', async () => {
            getMultipleAttributes.mockResolvedValue({});

            const result = await vstService.getVSTDetails('VST_7_admin_100');

            expect(result.name).toBe('Template 100');
            expect(result.cost).toBe(0);
            expect(result.description).toBe('No description available');
            expect(result.html).toBe('');
        });

        it('should parse requisites correctly', async () => {
            getMultipleAttributes.mockResolvedValue({
                ...mockVSTDetails,
                VS_REQUISITES: 'linux networking docker'
            });

            const result = await vstService.getVSTDetails('VST_7_admin_100');

            expect(result.requisites).toEqual(['linux', 'networking', 'docker']);
        });

        it('should handle empty requisites', async () => {
            getMultipleAttributes.mockResolvedValue({
                ...mockVSTDetails,
                VS_REQUISITES: ''
            });

            const result = await vstService.getVSTDetails('VST_7_admin_100');

            expect(result.requisites).toEqual([]);
        });

        it('should parse folder name correctly', async () => {
            const result = await vstService.getVSTDetails('VST_2_testuser_500');

            expect(result.id).toBe('500');
            expect(result.type).toBe(2);
            expect(result.owner).toBe('testuser');
        });
    });

    describe('getFormattedTypeDescription (via getVSTDetails)', () => {
        it('should return formatted type with number and description', async () => {
            const result = await vstService.getVSTDetails('VST_7_admin_100');
            
            expect(result.typeDescription).toBe('7 - LXC');
        });

        it('should handle unknown type', async () => {
            jest.isolateModules(async () => {
                const freshVstService = require('../../../src/services/vstService');
                const result = await freshVstService.getVSTDetails('VST_99_admin_100');
                
                expect(result.typeDescription).toBe('99 - Type 99');
            });
        });
    });
});