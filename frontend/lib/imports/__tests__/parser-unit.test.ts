import { describe, it, expect } from 'vitest';
import { 
  parseWebullCsvHeaders, 
  parseWebullCsvRow, 
  decodeWebullOptionSymbol,
  cleanPrice,
  extractQuantity,
  parseDate
} from '../webull';

describe('Webull Parser Unit Tests', () => {
  describe('parseWebullCsvHeaders', () => {
    it('should normalize headers correctly', () => {
      const headers = ['Symbol', 'Action', 'Status', 'Filled', 'Price', 'ExecutedTime'];
      const fieldMap = parseWebullCsvHeaders(headers);
      
      expect(fieldMap).toEqual({
        symbol: 'Symbol',
        action: 'Action', 
        status: 'Status',
        filled: 'Filled',
        price: 'Price',
        executedtime: 'ExecutedTime'
      });
    });

    it('should handle headers with spaces and special characters', () => {
      const headers = ['Symbol #', 'Action Type', 'Status Code', 'Filled Qty', 'Price $', 'Executed Time'];
      const fieldMap = parseWebullCsvHeaders(headers);
      
      expect(fieldMap).toEqual({
        symbol: 'Symbol #',
        filledqty: 'Filled Qty',
        price: 'Price $',
        executedtime: 'Executed Time'
      });
    });
  });

  describe('cleanPrice', () => {
    it('should clean price strings correctly', () => {
      expect(cleanPrice('150.00')).toBe(150.00);
      expect(cleanPrice('@150.00')).toBe(150.00);
      expect(cleanPrice('$150.00')).toBe(150.00);
      expect(cleanPrice('@ $150.00')).toBe(150.00);
      expect(cleanPrice('1,500.00')).toBe(1500.00);
      expect(cleanPrice('@ $1,500.00')).toBe(1500.00);
      expect(cleanPrice('')).toBe(0);
      expect(cleanPrice('invalid')).toBe(0);
    });
  });

  describe('extractQuantity', () => {
    it('should extract quantity from multiple sources', () => {
      const row1 = { Filled: '10', FilledQty: '5', Quantity: '8' };
      const row2 = { Filled: '', FilledQty: '15', Quantity: '' };
      const row3 = { Filled: '20', FilledQty: '', Quantity: '25' };
      
      const fieldMap = { filled: 'Filled', filledqty: 'FilledQty', quantity: 'Quantity' };
      
      expect(extractQuantity(row1, fieldMap)).toBe(10); // Prefer Filled
      expect(extractQuantity(row2, fieldMap)).toBe(15); // Fallback to FilledQty
      expect(extractQuantity(row3, fieldMap)).toBe(20); // Prefer Filled
    });

    it('should handle empty and zero values', () => {
      const row1 = { Filled: '', FilledQty: '', Quantity: '' };
      const row2 = { Filled: '0', FilledQty: '0', Quantity: '0' };
      
      const fieldMap = { filled: 'Filled', filledqty: 'FilledQty', quantity: 'Quantity' };
      
      expect(extractQuantity(row1, fieldMap)).toBe(0);
      expect(extractQuantity(row2, fieldMap)).toBe(0);
    });
  });

  describe('parseDate', () => {
    it('should parse various date formats', () => {
      expect(parseDate('2024-01-15 09:30:00')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(parseDate('01/15/2024 09:30:00 EDT')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(parseDate('01/15/2024')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle empty dates', () => {
      const result = parseDate('');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle invalid dates gracefully', () => {
      const result = parseDate('invalid-date');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('decodeWebullOptionSymbol', () => {
    it('should decode call options correctly', () => {
      const result = decodeWebullOptionSymbol('TSLA250822C00325000');
      
      expect(result).toEqual({
        underlying: 'TSLA',
        expiry: '2025-08-22',
        type: 'C',
        strike: 325.000
      });
    });

    it('should decode put options correctly', () => {
      const result = decodeWebullOptionSymbol('SPY250822P00400000');
      
      expect(result).toEqual({
        underlying: 'SPY',
        expiry: '2025-08-22', 
        type: 'P',
        strike: 400.000
      });
    });

    it('should handle invalid option symbols', () => {
      expect(decodeWebullOptionSymbol('INVALID')).toBeNull();
      expect(decodeWebullOptionSymbol('TSLA250822X00325000')).toBeNull(); // Invalid type
      expect(decodeWebullOptionSymbol('TSLA250132C00325000')).toBeNull(); // Invalid date
      expect(decodeWebullOptionSymbol('A250822C00325000')).toBeNull(); // Too short underlying
    });

    it('should handle edge cases', () => {
      // Low strike price
      const result1 = decodeWebullOptionSymbol('TSLA250822C00001000');
      expect(result1?.strike).toBe(1.000);
      
      // High strike price
      const result2 = decodeWebullOptionSymbol('TSLA250822C01000000');
      expect(result2?.strike).toBe(1000.000);
    });
  });

  describe('parseWebullCsvRow', () => {
    it('should parse valid filled trade correctly', () => {
      const row = {
        Symbol: 'AAPL',
        Action: 'Buy',
        Status: 'Filled',
        Filled: '10',
        Price: '150.00',
        ExecutedTime: '2024-01-15 09:30:00',
        Commission: '1.00',
        Fees: '0.50'
      };
      
      const fieldMap = {
        symbol: 'Symbol',
        action: 'Action',
        status: 'Status',
        filled: 'Filled',
        price: 'Price',
        executedtime: 'ExecutedTime',
        commission: 'Commission',
        fees: 'Fees'
      };
      
      const result = parseWebullCsvRow(row, fieldMap, 2);
      
      expect(result.symbolRaw).toBe('AAPL');
      expect(result.symbol).toBe('AAPL');
      expect(result.assetType).toBe('equity');
      expect(result.side).toBe('buy');
      expect(result.quantity).toBe(10);
      expect(result.price).toBe(150.00);
      expect(result.status).toBe('filled');
      expect(result.commission).toBe(1.00);
      expect(result.fees).toBe(0.50);
    });

    it('should parse valid option trade correctly', () => {
      const row = {
        Symbol: 'TSLA250822C00325000',
        Action: 'Sell',
        Status: 'Filled',
        Filled: '5',
        Price: '325.00',
        ExecutedTime: '2024-01-15 10:15:00',
        Commission: '2.50',
        Fees: '1.25'
      };
      
      const fieldMap = {
        symbol: 'Symbol',
        action: 'Action',
        status: 'Status',
        filled: 'Filled',
        price: 'Price',
        executedtime: 'ExecutedTime',
        commission: 'Commission',
        fees: 'Fees'
      };
      
      const result = parseWebullCsvRow(row, fieldMap, 3);
      
      expect(result.symbolRaw).toBe('TSLA250822C00325000');
      expect(result.symbol).toBe('TSLA 2025-08-22 325C');
      expect(result.assetType).toBe('option');
      expect(result.side).toBe('sell');
      expect(result.quantity).toBe(5);
      expect(result.price).toBe(325.00);
    });

    it('should handle price with @ symbol', () => {
      const row = {
        Symbol: 'META',
        Action: 'Sell',
        Status: 'Filled',
        Filled: '8',
        Price: '@450.00',
        ExecutedTime: '2024-01-15 15:00:00',
        Commission: '2.00',
        Fees: '1.00'
      };
      
      const fieldMap = {
        symbol: 'Symbol',
        action: 'Action',
        status: 'Status',
        filled: 'Filled',
        price: 'Price',
        executedtime: 'ExecutedTime',
        commission: 'Commission',
        fees: 'Fees'
      };
      
      const result = parseWebullCsvRow(row, fieldMap, 8);
      
      expect(result.price).toBe(450.00);
    });

    it('should throw error for missing symbol', () => {
      const row = {
        Symbol: '',
        Action: 'Buy',
        Status: 'Filled',
        Filled: '10',
        Price: '150.00',
        ExecutedTime: '2024-01-15 09:30:00'
      };
      
      const fieldMap = {
        symbol: 'Symbol',
        action: 'Action',
        status: 'Status',
        filled: 'Filled',
        price: 'Price',
        executedtime: 'ExecutedTime'
      };
      
      expect(() => parseWebullCsvRow(row, fieldMap, 2)).toThrow();
    });

    it('should throw error for zero quantity', () => {
      const row = {
        Symbol: 'AAPL',
        Action: 'Buy',
        Status: 'Filled',
        Filled: '0',
        Price: '150.00',
        ExecutedTime: '2024-01-15 09:30:00'
      };
      
      const fieldMap = {
        symbol: 'Symbol',
        action: 'Action',
        status: 'Status',
        filled: 'Filled',
        price: 'Price',
        executedtime: 'ExecutedTime'
      };
      
      expect(() => parseWebullCsvRow(row, fieldMap, 2)).toThrow();
    });

    it('should throw error for zero price', () => {
      const row = {
        Symbol: 'AAPL',
        Action: 'Buy',
        Status: 'Filled',
        Filled: '10',
        Price: '0.00',
        ExecutedTime: '2024-01-15 09:30:00'
      };
      
      const fieldMap = {
        symbol: 'Symbol',
        action: 'Action',
        status: 'Status',
        filled: 'Filled',
        price: 'Price',
        executedtime: 'ExecutedTime'
      };
      
      expect(() => parseWebullCsvRow(row, fieldMap, 2)).toThrow();
    });

    it('should throw error for cancelled status', () => {
      const row = {
        Symbol: 'MSFT',
        Action: 'Buy',
        Status: 'Cancelled',
        Filled: '0',
        Price: '250.00',
        ExecutedTime: '2024-01-15 11:00:00'
      };
      
      const fieldMap = {
        symbol: 'Symbol',
        action: 'Action',
        status: 'Status',
        filled: 'Filled',
        price: 'Price',
        executedtime: 'ExecutedTime'
      };
      
      expect(() => parseWebullCsvRow(row, fieldMap, 4)).toThrow();
    });
  });
});
