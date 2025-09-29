import { describe, it, expect } from 'vitest';
import { 
  createTransactionErrorResponse, 
  createTransactionSuccessResponse 
} from '../transactionWrapper';

describe('Transaction Response Functions', () => {
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
    expect(response.profiling.skipped.cancelled).toBe(10);
    expect(response.skippedRows).toHaveLength(1);
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
    expect(response.stats.skipped).toBe(15); // 10 + 3 + 2
    expect(response.skippedRows).toHaveLength(1);
  });

  it('should handle empty trades array in error response', () => {
    const error = new Error('No trades to import');
    const summary = {
      totalRows: 10,
      headerRows: 1,
      parsedRows: 0,
      filledRows: 0,
      skipped: {
        cancelled: 9,
        zeroQty: 0,
        zeroPrice: 0,
        badDate: 0,
        parseError: 0
      }
    };
    const skippedRows = [];

    const response = createTransactionErrorResponse(error, summary, skippedRows);

    expect(response.success).toBe(false);
    expect(response.profiling.importedRows).toBe(0);
    expect(response.profiling.filledRows).toBe(0);
    expect(response.skippedRows).toHaveLength(0);
  });

  it('should handle partial success in success response', () => {
    const result = {
      inserted: 50,
      skipped: 0,
      duplicatesSkipped: 10,
      errors: 5,
      summary: {
        totalProcessed: 65,
        newTrades: 50,
        duplicateTrades: 10,
        errorTrades: 5
      }
    };
    const summary = {
      totalRows: 100,
      headerRows: 1,
      parsedRows: 95,
      filledRows: 80,
      skipped: {
        cancelled: 15,
        zeroQty: 5,
        zeroPrice: 3,
        badDate: 2,
        parseError: 0
      }
    };
    const skippedRows = [
      { rowIndex: 1, reason: 'cancelled', symbolRaw: 'AAPL' },
      { rowIndex: 2, reason: 'zeroQty', symbolRaw: 'TSLA' }
    ];

    const response = createTransactionSuccessResponse(result, summary, skippedRows);

    expect(response.success).toBe(true);
    expect(response.profiling.importedRows).toBe(50);
    expect(response.stats.inserted).toBe(50);
    expect(response.stats.duplicatesSkipped).toBe(10);
    expect(response.stats.errors).toBe(5);
    expect(response.skippedRows).toHaveLength(2);
  });

  it('should preserve all summary data in responses', () => {
    const error = new Error('Test error');
    const summary = {
      totalRows: 200,
      headerRows: 1,
      parsedRows: 190,
      filledRows: 150,
      skipped: {
        cancelled: 20,
        zeroQty: 10,
        zeroPrice: 5,
        badDate: 3,
        parseError: 2
      }
    };
    const skippedRows = [
      { rowIndex: 1, reason: 'cancelled', symbolRaw: 'AAPL' },
      { rowIndex: 2, reason: 'zeroQty', symbolRaw: 'TSLA' },
      { rowIndex: 3, reason: 'badDate', symbolRaw: 'MSFT' }
    ];

    const errorResponse = createTransactionErrorResponse(error, summary, skippedRows);
    const successResponse = createTransactionSuccessResponse(
      { inserted: 0, skipped: 0, duplicatesSkipped: 0, errors: 0, summary: { totalProcessed: 0, newTrades: 0, duplicateTrades: 0, errorTrades: 0 } },
      summary,
      skippedRows
    );

    // Both responses should preserve the same summary data
    expect(errorResponse.profiling.totalRows).toBe(200);
    expect(successResponse.profiling.totalRows).toBe(200);
    
    expect(errorResponse.profiling.skipped.cancelled).toBe(20);
    expect(successResponse.profiling.skipped.cancelled).toBe(20);
    
    expect(errorResponse.skippedRows).toHaveLength(3);
    expect(successResponse.skippedRows).toHaveLength(3);
  });
});
