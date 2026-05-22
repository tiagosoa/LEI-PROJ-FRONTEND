const creditService = require('../../../src/services/creditService');
const { runLocalCommand } = require('../../../src/utils/commandExecutor');

jest.mock('../../../src/utils/commandExecutor');

describe('CreditService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserCredit', () => {
        it('should return numeric credit for valid user', async () => {
            runLocalCommand.mockResolvedValue('15');
            
            const credit = await creditService.getUserCredit('testuser');
            
            expect(credit).toBe(15);
            expect(runLocalCommand).toHaveBeenCalledWith('/ctl/getCredit testuser');
        });

        it('should return 10000 for admin role', async () => {
            runLocalCommand.mockResolvedValue('admin');
            
            const credit = await creditService.getUserCredit('adminuser');
            
            expect(credit).toBe(10000);
        });

        it('should return default 15 on error', async () => {
            runLocalCommand.mockRejectedValue(new Error('Command failed'));
            
            const credit = await creditService.getUserCredit('testuser');
            
            expect(credit).toBe(15);
        });
    });

    describe('getAvailableCredit', () => {
        it('should calculate available credit correctly', async () => {
            runLocalCommand.mockResolvedValueOnce('20');
            runLocalCommand.mockResolvedValueOnce('8');
            
            const credit = await creditService.getAvailableCredit('testuser');
            
            expect(credit).toEqual({
                total: 20,
                used: 8,
                available: 12
            });
        });
    });

    describe('hasSufficientCredit', () => {
        it('should return true when credit is sufficient', async () => {
            runLocalCommand.mockResolvedValueOnce('20');
            runLocalCommand.mockResolvedValueOnce('5');
            
            const result = await creditService.hasSufficientCredit('testuser', 10);
            
            expect(result).toBe(true);
        });

        it('should return false when credit is insufficient', async () => {
            runLocalCommand.mockResolvedValueOnce('20');
            runLocalCommand.mockResolvedValueOnce('15');
            
            const result = await creditService.hasSufficientCredit('testuser', 10);
            
            expect(result).toBe(false);
        });
    });
});