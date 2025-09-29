import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  executeImportTransaction, 
  createTransactionErrorResponse, 
  createTransactionSuccessResponse 
} from '../transactionWrapper';
import { WebullTradeDTO } from '../webull';
import { UpsertResult } from '../upsertTrades';

// Mock the upsertTrades function
vi.mock('../upsertTrades', () => ({
  upsertTrades: vi.fn()
}));

// Mock the logger
vi.mock('../errors', () => ({
  logImportError: vi.fn()
}));

describe('Transaction Wrapper', () => {
  let mockSupabase: any;
  let mockTrades: WebullTradeDTO[];
  let mockUserId: string;
  let mockFileId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'test-user' },
              error: null
            }))
          })),
          limit: vi.fn(() => ({
            data: [{ id: 'test-trade' }],
            error: null
          }))
        }))
      }))
    };

    // Mock trade data
    mockTrades = [
      {
        externalId: 'order123',
        broker: 'webull',
        symbolRaw: 'AAPL',
        symbol: 'AAPL',
        assetType: 'equity',
        side: 'buy',
        quantity: 100,
        price: 150.50,
        fees: 1.00,
        commission: 0.00,
        status: 'filled',
        executedAt: '2025-01-28T10:00:00Z',
        meta: {
          rowIndex: 1,
          raw: {},
          source: 'webull-csv'
        }
      }
    ];

    mockUserId = 'test-user-id';
    mockFileId = 'test-file-id';
  });

  describe('executeImportTransaction', () => {
    it('should execute successfully with valid trades', async () => {
      const { upsertTrades } = await import('../upsertTrades');
      const mockResult: UpsertResult = {
        inserted: 1,
        skipped: 0,
        duplicatesSkipped: 0,
        errors: 0,
        summary: {
          totalProcessed: 1,
          newTrades: 1,
          duplicateTrades: 0,
          errorTrades: 0
        }
      };
      
      vi.mocked(upsertTrades).mockResolvedValue(mockResult);

      const result = await executeImportTransaction(
        mockSupabase,
        mockTrades,
        mockUserId,
        mockFileId
      );

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResult);
      expect(result.error).toBeUndefined();
    });

    it('should handle validation errors', async () => {
      // Mock validation failure
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'User not found' }
            }))
          }))
        }))
      });

      const result = await executeImportTransaction(
        mockSupabase,
        mockTrades,
        mockUserId,
        mockFileId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Pre-validation failed');
      expect(result.rollbackRequired).toBe(true);
    });

    it('should handle upsert failures', async () => {
      const { upsertTrades } = await import('../upsertTrades');
      const mockResult: UpsertResult = {
        inserted: 0,
        skipped: 0,
        duplicatesSkipped: 0,
        errors: 1,
        summary: {
          totalProcessed: 1,
          newTrades: 0,
          duplicateTrades: 0,
          errorTrades: 1
        }
      };
      
      vi.mocked(upsertTrades).mockResolvedValue(mockResult);

      const result = await executeImportTransaction(
        mockSupabase,
        mockTrades,
        mockUserId,
        mockFileId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('All 1 trades failed to import');
      expect(result.rollbackRequired).toBe(true);
    });

    it('should handle partial failures with high error rate', async () => {
      const { upsertTrades } = await import('../upsertTrades');
      const mockResult: UpsertResult = {
        inserted: 1,
        skipped: 0,
        duplicatesSkipped: 0,
        errors: 5, // More than 50% of 1 trade
        summary: {
          totalProcessed: 1,
          newTrades: 1,
          duplicateTrades: 0,
          errorTrades: 5
        }
      };
      
      vi.mocked(upsertTrades).mockResolvedValue(mockResult);

      const result = await executeImportTransaction(
        mockSupabase,
        mockTrades,
        mockUserId,
        mockFileId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many failures');
      expect(result.rollbackRequired).toBe(true);
    });

    it('should call success callback on success', async () => {
      const { upsertTrades } = await import('../upsertTrades');
      const mockResult: UpsertResult = {
        inserted: 1,
        skipped: 0,
        duplicatesSkipped: 0,
        errors: 0,
        summary: {
          totalProcessed: 1,
          newTrades: 1,
          duplicateTrades: 0,
          errorTrades: 0
        }
      };
      
      vi.mocked(upsertTrades).mockResolvedValue(mockResult);
      
      const onSuccess = vi.fn();
      const onError = vi.fn();

      await executeImportTransaction(
        mockSupabase,
        mockTrades,
        mockUserId,
        mockFileId,
        onSuccess,
        onError
      );

      expect(onSuccess).toHaveBeenCalledWith(mockResult);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call error callback on failure', async () => {
      const { upsertTrades } = await import('../upsertTrades');
      vi.mocked(upsertTrades).mockRejectedValue(new Error('Database error'));
      
      const onSuccess = vi.fn();
      const onError = vi.fn();

      await executeImportTransaction(
        mockSupabase,
        mockTrades,
        mockUserId,
        mockFileId,
        onSuccess,
        onError
      );

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('createTransactionErrorResponse', () => {
    it('should create proper error response', () => {
      const error = new Error('Test error');
      const summary = {
        totalRows: 100,
        headerRows: 1,
        parsedRows: 95,
        filledRows: 80,
        skipped: {
          cancelled: 10,
          zeroQty: 3,
          zeroPrice: 2,
          badDate: 0,
          parseError: 0
        }
      };
      const skippedRows = [
        { rowIndex: 1, reason: 'cancelled', symbolRaw: 'AAPL' }
      ];

      const response = createTransactionErrorResponse(error, summary, skippedRows);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Import failed due to a database error');
      expect(response.message).toBe('The import was rolled back to prevent partial data. Please try again.');
      expect(response.details).toBe('Test error');
      expect(response.profiling.importedRows).toBe(0);
      expect(response.profiling.totalRows).toBe(100);
    });
  });

  describe('createTransactionSuccessResponse', () => {
    it('should create proper success response', () => {
      const result: UpsertResult = {
        inserted: 75,
        skipped: 0,
        duplicatesSkipped: 5,
        errors: 0,
        summary: {
          totalProcessed: 80,
          newTrades: 75,
          duplicateTrades: 5,
          errorTrades: 0
        }
      };
      const summary = {
        totalRows: 100,
        headerRows: 1,
        parsedRows: 95,
        filledRows: 80,
        skipped: {
          cancelled: 10,
          zeroQty: 3,
          zeroPrice: 2,
          badDate: 0,
          parseError: 0
        }
      };
      const skippedRows = [
        { rowIndex: 1, reason: 'cancelled', symbolRaw: 'AAPL' }
      ];

      const response = createTransactionSuccessResponse(result, summary, skippedRows);

      expect(response.success).toBe(true);
      expect(response.message).toBe('Webull CSV import completed successfully');
      expect(response.profiling.importedRows).toBe(75);
      expect(response.stats.inserted).toBe(75);
      expect(response.stats.duplicatesSkipped).toBe(5);
    });
  });
});


