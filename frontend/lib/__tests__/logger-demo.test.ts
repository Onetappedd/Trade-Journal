import { describe, it, expect, vi } from 'vitest';
import { 
  logImportStart, 
  logImportSummary, 
  logImportErrors, 
  logImportComplete,
  logImportError,
  webullLogger 
} from '../logger';

describe('Logger Demo', () => {
  it('should demonstrate complete logging flow', () => {
    const mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
    
    // Mock the webullLogger
    (webullLogger as any).info = mockLogger.info;
    (webullLogger as any).warn = mockLogger.warn;
    (webullLogger as any).error = mockLogger.error;

    const fileId = 'demo-123';
    const userId = 'user-456';
    const fileName = 'webull-trades.csv';

    // 1. Log import start
    logImportStart(fileId, userId, fileName);
    
    // 2. Log import summary
    const summary = {
      totalRows: 100,
      parsedRows: 95,
      filledRows: 80,
      importedRows: 75,
      skipped: {
        cancelled: 10,
        zeroQty: 3,
        zeroPrice: 2,
        badDate: 0,
        parseError: 0
      }
    };
    logImportSummary(fileId, userId, summary);
    
    // 3. Log errors if any
    const errors = [
      { rowIndex: 1, code: 'PARSE_ERROR', message: 'Invalid date format', symbolRaw: 'AAPL' },
      { rowIndex: 2, code: 'ZERO_QTY', message: 'Zero quantity detected', symbolRaw: 'TSLA' }
    ];
    logImportErrors(fileId, userId, errors);
    
    // 4. Log import completion
    const result = {
      inserted: 75,
      duplicatesSkipped: 5,
      errors: 0
    };
    logImportComplete(fileId, userId, result);
    
    // Verify all logging calls were made
    expect(mockLogger.info).toHaveBeenCalledTimes(3); // start, summary, complete
    expect(mockLogger.warn).toHaveBeenCalledTimes(1); // errors
    
    // Verify PII masking is working
    const startCall = mockLogger.info.mock.calls[0];
    expect(startCall[0].data.userId).toBe('us***56'); // PII masked
    
    const summaryCall = mockLogger.info.mock.calls[1];
    expect(summaryCall[0].data.userId).toBe('us***56'); // PII masked
    
    const completeCall = mockLogger.info.mock.calls[2];
    expect(completeCall[0].data.userId).toBe('us***56'); // PII masked
    
    // Verify error logging
    const errorCall = mockLogger.warn.mock.calls[0];
    expect(errorCall[0].data.errorCount).toBe(2);
    expect(errorCall[0].data.firstErrors).toHaveLength(2);
    expect(errorCall[0].data.userId).toBe('us***56'); // PII masked
  });

  it('should demonstrate error logging', () => {
    const mockLogger = {
      error: vi.fn()
    };
    
    (webullLogger as any).error = mockLogger.error;

    const fileId = 'error-demo-123';
    const userId = 'user-789';
    const error = new Error('Database connection failed');
    error.stack = 'Error: Database connection failed\n    at connect()';

    logImportError(fileId, userId, error, 'database-connection');
    
    expect(mockLogger.error).toHaveBeenCalledWith(
      { 
        data: {
          fileId: 'error-demo-123',
          userId: 'us***89', // PII masked
          error: {
            name: 'Er***or', // PII masked
            message: 'Database connection failed',
            stack: 'Error: Database connection failed\n    at connect()'
          }
        }
      },
      'Webull import failed in database-connection'
    );
  });
});
