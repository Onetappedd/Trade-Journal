import { decodeWebullOptionSymbol, WebullOptionInfo } from '../webull';

describe('decodeWebullOptionSymbol', () => {
  describe('Valid option symbols', () => {
    test('should parse TSLA250822C00325000 correctly', () => {
      const result = decodeWebullOptionSymbol('TSLA250822C00325000');
      expect(result).toEqual({
        underlying: 'TSLA',
        expiry: '2025-08-22',
        type: 'C',
        strike: 325.000
      });
    });

    test('should parse AAPL241220P00150000 correctly', () => {
      const result = decodeWebullOptionSymbol('AAPL241220P00150000');
      expect(result).toEqual({
        underlying: 'AAPL',
        expiry: '2024-12-20',
        type: 'P',
        strike: 150.000
      });
    });

    test('should parse SPY250315C00500000 correctly', () => {
      const result = decodeWebullOptionSymbol('SPY250315C00500000');
      expect(result).toEqual({
        underlying: 'SPY',
        expiry: '2025-03-15',
        type: 'C',
        strike: 500.000
      });
    });

    test('should handle low strike prices', () => {
      const result = decodeWebullOptionSymbol('TSLA250822C00001000');
      expect(result).toEqual({
        underlying: 'TSLA',
        expiry: '2025-08-22',
        type: 'C',
        strike: 1.000
      });
    });

    test('should handle high strike prices', () => {
      const result = decodeWebullOptionSymbol('TSLA250822C10000000');
      expect(result).toEqual({
        underlying: 'TSLA',
        expiry: '2025-08-22',
        type: 'C',
        strike: 10000.000
      });
    });

    test('should handle year 2000-2049 range', () => {
      const result = decodeWebullOptionSymbol('TSLA000101C00325000');
      expect(result).toEqual({
        underlying: 'TSLA',
        expiry: '2000-01-01',
        type: 'C',
        strike: 325.000
      });
    });

    test('should handle year 1950-1999 range', () => {
      const result = decodeWebullOptionSymbol('TSLA990101C00325000');
      expect(result).toEqual({
        underlying: 'TSLA',
        expiry: '1999-01-01',
        type: 'C',
        strike: 325.000
      });
    });
  });

  describe('Invalid option symbols', () => {
    test('should return null for equity symbols', () => {
      expect(decodeWebullOptionSymbol('TSLA')).toBeNull();
      expect(decodeWebullOptionSymbol('AAPL')).toBeNull();
      expect(decodeWebullOptionSymbol('SPY')).toBeNull();
    });

    test('should return null for invalid length', () => {
      expect(decodeWebullOptionSymbol('TSLA250822C0032500')).toBeNull(); // Too short
      expect(decodeWebullOptionSymbol('TSLA250822C003250000')).toBeNull(); // Too long
    });

    test('should return null for missing components', () => {
      expect(decodeWebullOptionSymbol('TSLA25082200325000')).toBeNull(); // Missing C/P
      expect(decodeWebullOptionSymbol('250822C00325000')).toBeNull(); // Missing underlying
      expect(decodeWebullOptionSymbol('TSLA250822C')).toBeNull(); // Missing strike
    });

    test('should return null for invalid date format', () => {
      expect(decodeWebullOptionSymbol('TSLA25082C00325000')).toBeNull(); // Invalid date length
      expect(decodeWebullOptionSymbol('TSLA25082XC00325000')).toBeNull(); // Non-numeric date
    });

    test('should return null for invalid date components', () => {
      expect(decodeWebullOptionSymbol('TSLA250132C00325000')).toBeNull(); // Invalid month (13)
      expect(decodeWebullOptionSymbol('TSLA250232C00325000')).toBeNull(); // Invalid day (32)
      expect(decodeWebullOptionSymbol('TSLA250229C00325000')).toBeNull(); // Invalid leap year (2025 is not leap year)
    });

    test('should return null for invalid strike format', () => {
      expect(decodeWebullOptionSymbol('TSLA250822C0032500X')).toBeNull(); // Non-numeric strike
      expect(decodeWebullOptionSymbol('TSLA250822C00000000')).toBeNull(); // Zero strike
      expect(decodeWebullOptionSymbol('TSLA250822C10001000')).toBeNull(); // Strike too high (>10000)
    });

    test('should return null for invalid option type', () => {
      expect(decodeWebullOptionSymbol('TSLA250822X00325000')).toBeNull(); // Invalid type (X)
      expect(decodeWebullOptionSymbol('TSLA250822c00325000')).toBeNull(); // Lowercase type
    });

    test('should return null for empty or whitespace', () => {
      expect(decodeWebullOptionSymbol('')).toBeNull();
      expect(decodeWebullOptionSymbol('   ')).toBeNull();
    });
  });

  describe('Edge cases', () => {
    test('should handle leap year correctly', () => {
      const result = decodeWebullOptionSymbol('TSLA240229C00325000'); // 2024 is leap year
      expect(result).toEqual({
        underlying: 'TSLA',
        expiry: '2024-02-29',
        type: 'C',
        strike: 325.000
      });
    });

    test('should reject invalid leap year', () => {
      expect(decodeWebullOptionSymbol('TSLA250229C00325000')).toBeNull(); // 2025 is not leap year
    });

    test('should handle different underlying lengths', () => {
      expect(decodeWebullOptionSymbol('A250822C00325000')).toBeNull(); // Too short underlying (1 char)
      expect(decodeWebullOptionSymbol('AB250822C00325000')).not.toBeNull(); // Valid short underlying (2 chars)
      expect(decodeWebullOptionSymbol('VERYLONGSYMBOL250822C00325000')).not.toBeNull(); // Long underlying
    });

    test('should handle decimal strike prices correctly', () => {
      const result = decodeWebullOptionSymbol('TSLA250822C00325050'); // 325.050
      expect(result).toEqual({
        underlying: 'TSLA',
        expiry: '2025-08-22',
        type: 'C',
        strike: 325.050
      });
    });

    test('should handle minimum valid date', () => {
      const result = decodeWebullOptionSymbol('TSLA250101C00325000');
      expect(result).toEqual({
        underlying: 'TSLA',
        expiry: '2025-01-01',
        type: 'C',
        strike: 325.000
      });
    });

    test('should handle maximum valid date', () => {
      const result = decodeWebullOptionSymbol('TSLA251231C00325000');
      expect(result).toEqual({
        underlying: 'TSLA',
        expiry: '2025-12-31',
        type: 'C',
        strike: 325.000
      });
    });
  });

  describe('Real-world examples', () => {
    test('should parse typical TSLA call option', () => {
      const result = decodeWebullOptionSymbol('TSLA250822C00325000');
      expect(result).toEqual({
        underlying: 'TSLA',
        expiry: '2025-08-22',
        type: 'C',
        strike: 325.000
      });
    });

    test('should parse typical AAPL put option', () => {
      const result = decodeWebullOptionSymbol('AAPL241220P00150000');
      expect(result).toEqual({
        underlying: 'AAPL',
        expiry: '2024-12-20',
        type: 'P',
        strike: 150.000
      });
    });

    test('should parse SPY option with high strike', () => {
      const result = decodeWebullOptionSymbol('SPY250315C00500000');
      expect(result).toEqual({
        underlying: 'SPY',
        expiry: '2025-03-15',
        type: 'C',
        strike: 500.000
      });
    });

    test('should parse QQQ option with decimal strike', () => {
      const result = decodeWebullOptionSymbol('QQQ250315P00350000');
      expect(result).toEqual({
        underlying: 'QQQ',
        expiry: '2025-03-15',
        type: 'P',
        strike: 350.000
      });
    });
  });
});
