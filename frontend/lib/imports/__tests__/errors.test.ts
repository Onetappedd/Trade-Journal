import { describe, it, expect } from 'vitest';
import { 
  createImportError, 
  getErrorMessage, 
  createErrorSummary, 
  logImportError,
  createErrorResponse,
  ImportErrorCode 
} from '../errors';

describe('Standardized Error Codes', () => {
  describe('createImportError', () => {
    it('should create error with all required fields', () => {
      const error = createImportError(5, 'BAD_DATE', 'AAPL', { field: 'timestamp' });
      
      expect(error).toEqual({
        rowIndex: 5,
        code: 'BAD_DATE',
        message: 'Invalid date format. Please ensure dates are in MM/DD/YYYY or YYYY-MM-DD format.',
        symbolRaw: 'AAPL',
        details: { field: 'timestamp' }
      });
    });

    it('should handle all error codes', () => {
      const codes: ImportErrorCode[] = [
        'PARSE_ERROR',
        'BAD_DATE', 
        'BAD_PRICE',
        'ZERO_QTY',
        'CANCELLED',
        'DUPLICATE',
        'MISSING_REQUIRED'
      ];

      codes.forEach(code => {
        const error = createImportError(1, code, 'TEST', { test: true });
        expect(error.code).toBe(code);
        expect(error.rowIndex).toBe(1);
        expect(error.symbolRaw).toBe('TEST');
        expect(error.details).toEqual({ test: true });
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should return user-friendly messages for all error codes', () => {
      expect(getErrorMessage('PARSE_ERROR')).toBe('Unable to parse trade data. Please check the row format.');
      expect(getErrorMessage('BAD_DATE')).toBe('Invalid date format. Please ensure dates are in MM/DD/YYYY or YYYY-MM-DD format.');
      expect(getErrorMessage('BAD_PRICE')).toBe('Invalid price format. Please ensure prices are positive numbers.');
      expect(getErrorMessage('ZERO_QTY')).toBe('Zero quantity detected. Only filled trades with positive quantities are imported.');
      expect(getErrorMessage('CANCELLED')).toBe('Order was cancelled. Only filled trades are imported.');
      expect(getErrorMessage('DUPLICATE')).toBe('This trade already exists in your account. Duplicates are automatically skipped.');
      expect(getErrorMessage('MISSING_REQUIRED')).toBe('Required field is missing. Please check that all necessary columns are present.');
    });

    it('should handle unknown error codes', () => {
      expect(getErrorMessage('UNKNOWN' as ImportErrorCode)).toBe('Unknown error occurred during import.');
    });
  });

  describe('createErrorSummary', () => {
    it('should count errors by code', () => {
      const errors = [
        createImportError(1, 'BAD_DATE', 'AAPL'),
        createImportError(2, 'BAD_DATE', 'TSLA'),
        createImportError(3, 'ZERO_QTY', 'MSFT'),
        createImportError(4, 'CANCELLED', 'GOOGL'),
        createImportError(5, 'CANCELLED', 'AMZN')
      ];

      const summary = createErrorSummary(errors);
      
      expect(summary.BAD_DATE).toBe(2);
      expect(summary.ZERO_QTY).toBe(1);
      expect(summary.CANCELLED).toBe(2);
      expect(summary.PARSE_ERROR).toBe(0);
      expect(summary.BAD_PRICE).toBe(0);
      expect(summary.DUPLICATE).toBe(0);
      expect(summary.MISSING_REQUIRED).toBe(0);
    });

    it('should handle empty error array', () => {
      const summary = createErrorSummary([]);
      
      Object.values(summary).forEach(count => {
        expect(count).toBe(0);
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create complete error response', () => {
      const errors = [
        createImportError(1, 'BAD_DATE', 'AAPL'),
        createImportError(2, 'ZERO_QTY', 'TSLA')
      ];

      const response = createErrorResponse(errors);
      
      expect(response.errors).toEqual(errors);
      expect(response.totalErrors).toBe(2);
      expect(response.errorSummary.BAD_DATE).toBe(1);
      expect(response.errorSummary.ZERO_QTY).toBe(1);
      expect(response.errorSummary.PARSE_ERROR).toBe(0);
    });
  });

  describe('logImportError', () => {
    it('should not throw when logging errors', () => {
      const error = createImportError(1, 'BAD_DATE', 'AAPL', { test: true });
      
      // Should not throw
      expect(() => logImportError(error, 'test-context')).not.toThrow();
    });
  });
});
