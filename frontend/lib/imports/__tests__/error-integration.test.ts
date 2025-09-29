import { describe, it, expect } from 'vitest';
import { processWebullCsv, parseWebullCsvHeaders } from '../webull';
import { createImportError, createErrorSummary } from '../errors';

describe('Error Integration Tests', () => {
  describe('processWebullCsv with various error scenarios', () => {
    it('should collect standardized errors for invalid CSV data', () => {
      const csvData = `Symbol,Action,Status,Filled,Price,ExecutedTime
AAPL,Buy,Filled,10,150.00,2024-01-15 10:30:00
,SELL,Cancelled,0,0.00,
TSLA,Buy,Filled,-5,300.00,invalid-date
MSFT,Buy,Filled,0,250.00,2024-01-15 11:00:00
GOOGL,Buy,Filled,5,0.00,2024-01-15 12:00:00`;

      const fieldMap = parseWebullCsvHeaders(['Symbol', 'Action', 'Status', 'Filled', 'Price', 'ExecutedTime']);
      const result = processWebullCsv(csvData, fieldMap);

      
      // Should have collected various types of errors
      expect(result.summary.errors.length).toBeGreaterThan(0);
      expect(result.summary.errorSummary).toBeDefined();
      
      // Check that error summary counts are correct
      const errorSummary = result.summary.errorSummary;
      expect(errorSummary.PARSE_ERROR).toBeGreaterThan(0); // All errors are currently categorized as PARSE_ERROR
      
      // Verify that errors are being collected with proper details
      expect(result.summary.errors.length).toBe(4);
      expect(result.summary.errors[0].code).toBe('PARSE_ERROR');
      expect(result.summary.errors[0].rowIndex).toBe(2);
      expect(result.summary.errors[1].code).toBe('PARSE_ERROR');
      expect(result.summary.errors[1].rowIndex).toBe(3);
    });

    it('should provide actionable error messages', () => {
      const errors = [
        createImportError(1, 'MISSING_REQUIRED', 'AAPL', { field: 'symbol' }),
        createImportError(2, 'BAD_DATE', 'TSLA', { value: 'invalid-date' }),
        createImportError(3, 'ZERO_QTY', 'MSFT', { quantity: 0 }),
        createImportError(4, 'BAD_PRICE', 'GOOGL', { price: -10 }),
        createImportError(5, 'CANCELLED', 'AMZN', { status: 'cancelled' }),
        createImportError(6, 'DUPLICATE', 'NVDA', { idempotencyKey: 'existing-key' })
      ];

      const summary = createErrorSummary(errors);
      
      expect(summary.MISSING_REQUIRED).toBe(1);
      expect(summary.BAD_DATE).toBe(1);
      expect(summary.ZERO_QTY).toBe(1);
      expect(summary.BAD_PRICE).toBe(1);
      expect(summary.CANCELLED).toBe(1);
      expect(summary.DUPLICATE).toBe(1);
      expect(summary.PARSE_ERROR).toBe(0);
    });

    it('should include row context in error details', () => {
      const error = createImportError(5, 'BAD_DATE', 'TSLA250822C00325000', {
        field: 'executedTime',
        value: 'invalid-date-format',
        row: { Symbol: 'TSLA250822C00325000', ExecutedTime: 'invalid-date-format' }
      });

      expect(error.rowIndex).toBe(5);
      expect(error.symbolRaw).toBe('TSLA250822C00325000');
      expect(error.details.field).toBe('executedTime');
      expect(error.details.value).toBe('invalid-date-format');
      expect(error.details.row).toBeDefined();
    });
  });

  describe('Error message clarity', () => {
    it('should provide user-friendly error messages', () => {
      const errorCodes = [
        'PARSE_ERROR',
        'BAD_DATE',
        'BAD_PRICE', 
        'ZERO_QTY',
        'CANCELLED',
        'DUPLICATE',
        'MISSING_REQUIRED'
      ];

      errorCodes.forEach(code => {
        const error = createImportError(1, code as any, 'TEST', {});
        
        // Messages should be actionable and not expose internal details
        expect(error.message).not.toContain('stack');
        expect(error.message).not.toContain('undefined');
        expect(error.message).not.toContain('null');
        expect(error.message.length).toBeGreaterThan(20); // Should be descriptive
      });
    });

    it('should hide internal details from client-facing messages', () => {
      const error = createImportError(1, 'BAD_DATE', 'AAPL', {
        internalStack: 'Error: at parseDate...',
        databaseQuery: 'SELECT * FROM trades...',
        rawValue: 'some-internal-data'
      });

      // Client message should not contain internal details
      expect(error.message).not.toContain('internalStack');
      expect(error.message).not.toContain('databaseQuery');
      expect(error.message).not.toContain('rawValue');
      
      // But details should be preserved for server logging
      expect(error.details.internalStack).toBeDefined();
      expect(error.details.databaseQuery).toBeDefined();
      expect(error.details.rawValue).toBeDefined();
    });
  });
});
