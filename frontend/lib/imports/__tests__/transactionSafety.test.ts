import { describe, it, expect, vi } from 'vitest';
import { 
  executeImportTransaction, 
  createTransactionErrorResponse, 
  createTransactionSuccessResponse 
} from '../transactionWrapper';

describe('Transaction Safety', () => {
  it('should prevent partial imports on critical failures', async () => {
    const mockSupabase = {
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

    const mockTrades = [
      {
        externalId: 'order123',
        broker: 'webull',
        symbolRaw: 'AAPL',
        symbol: 'AAPL',
        assetType: 'equity' as const,
        side: 'buy' as const,
        quantity: 100,
        price: 150.50,
        fees: 1.00,
        commission: 0.00,
        status: 'filled' as const,
        executedAt: '2025-01-28T10:00:00Z',
        meta: {
          rowIndex: 1,
          raw: {},
          source: 'webull-csv'
        }
      }
    ];

    // Mock upsertTrades to simulate all trades failing
    const { upsertTrades } = await import('../upsertTrades');
    vi.mocked(upsertTrades).mockResolvedValue({
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
    });

    const result = await executeImportTransaction(
      mockSupabase,
      mockTrades,
      'test-user',
      'test-file'
    );

    // Should fail and require rollback
    expect(result.success).toBe(false);
    expect(result.rollbackRequired).toBe(true);
    expect(result.error).toContain('All 1 trades failed to import');
  });

  it('should prevent partial imports on high error rate', async () => {
    const mockSupabase = {
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

    const mockTrades = [
      {
        externalId: 'order123',
        broker: 'webull',
        symbolRaw: 'AAPL',
        symbol: 'AAPL',
        assetType: 'equity' as const,
        side: 'buy' as const,
        quantity: 100,
        price: 150.50,
        fees: 1.00,
        commission: 0.00,
        status: 'filled' as const,
        executedAt: '2025-01-28T10:00:00Z',
        meta: {
          rowIndex: 1,
          raw: {},
          source: 'webull-csv'
        }
      }
    ];

    // Mock upsertTrades to simulate high error rate
    const { upsertTrades } = await import('../upsertTrades');
    vi.mocked(upsertTrades).mockResolvedValue({
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
    });

    const result = await executeImportTransaction(
      mockSupabase,
      mockTrades,
      'test-user',
      'test-file'
    );

    // Should fail and require rollback due to high error rate
    expect(result.success).toBe(false);
    expect(result.rollbackRequired).toBe(true);
    expect(result.error).toContain('Too many failures');
  });

  it('should create proper error response with rollback information', () => {
    const error = new Error('Database connection failed');
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
    expect(response.details).toBe('Database connection failed');
    expect(response.profiling.importedRows).toBe(0); // No imports due to rollback
    expect(response.profiling.totalRows).toBe(100);
  });

  it('should create proper success response with import statistics', () => {
    const result = {
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

  it('should validate trades before attempting import', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null, // User not found
              error: { message: 'User not found' }
            }))
          }))
        }))
      }))
    };

    const mockTrades = [
      {
        externalId: 'order123',
        broker: 'webull',
        symbolRaw: 'AAPL',
        symbol: 'AAPL',
        assetType: 'equity' as const,
        side: 'buy' as const,
        quantity: 100,
        price: 150.50,
        fees: 1.00,
        commission: 0.00,
        status: 'filled' as const,
        executedAt: '2025-01-28T10:00:00Z',
        meta: {
          rowIndex: 1,
          raw: {},
          source: 'webull-csv'
        }
      }
    ];

    const result = await executeImportTransaction(
      mockSupabase,
      mockTrades,
      'invalid-user',
      'test-file'
    );

    // Should fail during validation
    expect(result.success).toBe(false);
    expect(result.rollbackRequired).toBe(true);
    expect(result.error).toContain('Pre-validation failed');
  });
});
