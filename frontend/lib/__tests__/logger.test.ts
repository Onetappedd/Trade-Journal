import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  logWebullImport, 
  logImportStart, 
  logImportSummary, 
  logImportErrors, 
  logImportComplete,
  logImportError,
  webullLogger 
} from '../logger';

// Mock pino logger
vi.mock('pino', () => ({
  default: vi.fn(() => ({
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }))
  }))
}));

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logWebullImport', () => {
    it('should log info level messages', () => {
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      };
      
      // Mock the child logger
      (webullLogger as any).info = mockLogger.info;
      (webullLogger as any).warn = mockLogger.warn;
      (webullLogger as any).error = mockLogger.error;

      logWebullImport('info', 'Test message', { test: 'data' });
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        { data: { test: 'data' } },
        'Test message'
      );
    });

    it('should log warn level messages', () => {
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      };
      
      (webullLogger as any).warn = mockLogger.warn;

      logWebullImport('warn', 'Warning message', { warning: 'data' });
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { data: { warning: 'data' } },
        'Warning message'
      );
    });

    it('should log error level messages', () => {
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      };
      
      (webullLogger as any).error = mockLogger.error;

      logWebullImport('error', 'Error message', { error: 'data' });
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        { data: { error: 'data' } },
        'Error message'
      );
    });
  });

  describe('logImportStart', () => {
    it('should log import start with fileId and userId', () => {
      const mockLogger = {
        info: vi.fn()
      };
      
      (webullLogger as any).info = mockLogger.info;

      logImportStart('test-123', 'user-456', 'test-file.csv');
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        { 
          data: {
            fileId: 'test-123',
            userId: 'us***56',
            fileName: 'test-file.csv...'
          }
        },
        'Webull import started'
      );
    });

    it('should truncate long file names', () => {
      const mockLogger = {
        info: vi.fn()
      };
      
      (webullLogger as any).info = mockLogger.info;

      const longFileName = 'very-long-file-name-that-should-be-truncated.csv';
      logImportStart('test-123', 'user-456', longFileName);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        { 
          data: {
            fileId: 'test-123',
            userId: 'us***56',
            fileName: 'very-long-file-name-that-should-be-truncated.csv...'
          }
        },
        'Webull import started'
      );
    });
  });

  describe('logImportSummary', () => {
    it('should log import summary with counts', () => {
      const mockLogger = {
        info: vi.fn()
      };
      
      (webullLogger as any).info = mockLogger.info;

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

      logImportSummary('test-123', 'user-456', summary);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        { 
          data: {
            fileId: 'test-123',
            userId: 'us***56',
            summary
          }
        },
        'Webull import summary'
      );
    });
  });

  describe('logImportErrors', () => {
    it('should log first 3 errors only', () => {
      const mockLogger = {
        warn: vi.fn()
      };
      
      (webullLogger as any).warn = mockLogger.warn;

      const errors = [
        { rowIndex: 1, code: 'PARSE_ERROR', message: 'Error 1', symbolRaw: 'AAPL' },
        { rowIndex: 2, code: 'BAD_DATE', message: 'Error 2', symbolRaw: 'TSLA' },
        { rowIndex: 3, code: 'ZERO_QTY', message: 'Error 3', symbolRaw: 'MSFT' },
        { rowIndex: 4, code: 'BAD_PRICE', message: 'Error 4', symbolRaw: 'GOOGL' },
        { rowIndex: 5, code: 'CANCELLED', message: 'Error 5', symbolRaw: 'AMZN' }
      ];

      logImportErrors('test-123', 'user-456', errors);
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { 
          data: {
            fileId: 'test-123',
            userId: 'us***56',
            errorCount: 5,
            firstErrors: errors.slice(0, 3)
          }
        },
        'Webull import errors detected'
      );
    });
  });

  describe('logImportComplete', () => {
    it('should log import completion with results', () => {
      const mockLogger = {
        info: vi.fn()
      };
      
      (webullLogger as any).info = mockLogger.info;

      const result = {
        inserted: 75,
        duplicatesSkipped: 5,
        errors: 0
      };

      logImportComplete('test-123', 'user-456', result);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        { 
          data: {
            fileId: 'test-123',
            userId: 'us***56',
            result
          }
        },
        'Webull import completed'
      );
    });
  });

  describe('logImportError', () => {
    it('should log import error with context', () => {
      const mockLogger = {
        error: vi.fn()
      };
      
      (webullLogger as any).error = mockLogger.error;

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      logImportError('test-123', 'user-456', error, 'test-context');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        { 
          data: {
            fileId: 'test-123',
            userId: 'us***56',
            error: {
              name: 'Er***or',
              message: 'Test error',
              stack: 'Error stack trace'
            }
          }
        },
        'Webull import failed in test-context'
      );
    });

    it('should log import error without context', () => {
      const mockLogger = {
        error: vi.fn()
      };
      
      (webullLogger as any).error = mockLogger.error;

      const error = new Error('Test error');

      logImportError('test-123', 'user-456', error);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        { 
          data: {
            fileId: 'test-123',
            userId: 'us***56',
            error: {
              name: 'Er***or',
              message: 'Test error',
              stack: expect.any(String)
            }
          }
        },
        'Webull import failed'
      );
    });
  });
});
