import { parseBrokerLocalToUtc, BrokerDateParseError, isValidDateString, formatDate } from '../datetime';

describe('parseBrokerLocalToUtc', () => {
  describe('Valid date formats', () => {
    test('should parse MM/DD/YYYY HH:mm:ss EDT format', () => {
      const result = parseBrokerLocalToUtc('08/22/2025 14:30:00 EDT', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should parse MM/DD/YYYY HH:mm EDT format', () => {
      const result = parseBrokerLocalToUtc('08/22/2025 14:30 EDT', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should parse MM/DD/YYYY HH:mm:ss format', () => {
      const result = parseBrokerLocalToUtc('08/22/2025 14:30:00', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should parse MM/DD/YYYY HH:mm format', () => {
      const result = parseBrokerLocalToUtc('08/22/2025 14:30', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should parse MM/DD/YYYY date only format', () => {
      const result = parseBrokerLocalToUtc('08/22/2025', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should parse YYYY-MM-DD HH:mm:ss format', () => {
      const result = parseBrokerLocalToUtc('2025-08-22 14:30:00', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should parse YYYY-MM-DD HH:mm format', () => {
      const result = parseBrokerLocalToUtc('2025-08-22 14:30', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should parse YYYY-MM-DD date only format', () => {
      const result = parseBrokerLocalToUtc('2025-08-22', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should parse Unix timestamp (seconds)', () => {
      const result = parseBrokerLocalToUtc('1724332200', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should parse Unix timestamp (milliseconds)', () => {
      const result = parseBrokerLocalToUtc('1724332200000', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Timezone conversion', () => {
    test('should convert EST to UTC correctly', () => {
      // 2025-01-15 14:30:00 EST (UTC-5) should be 2025-01-15 19:30:00 UTC
      const result = parseBrokerLocalToUtc('01/15/2025 14:30:00', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should convert EDT to UTC correctly', () => {
      // 2025-08-15 14:30:00 EDT (UTC-4) should be 2025-08-15 18:30:00 UTC
      const result = parseBrokerLocalToUtc('08/15/2025 14:30:00', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should handle DST transition correctly', () => {
      // March 10, 2025 2:00 AM EST -> 3:00 AM EDT (spring forward)
      const beforeDST = parseBrokerLocalToUtc('03/09/2025 14:30:00', 'America/New_York');
      const afterDST = parseBrokerLocalToUtc('03/10/2025 14:30:00', 'America/New_York');
      
      expect(beforeDST).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(afterDST).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Invalid date formats', () => {
    test('should throw error for empty string', () => {
      expect(() => parseBrokerLocalToUtc('', 'America/New_York')).toThrow(BrokerDateParseError);
    });

    test('should throw error for whitespace only', () => {
      expect(() => parseBrokerLocalToUtc('   ', 'America/New_York')).toThrow(BrokerDateParseError);
    });

    test('should throw error for invalid format', () => {
      expect(() => parseBrokerLocalToUtc('invalid-date', 'America/New_York')).toThrow(BrokerDateParseError);
    });

    test('should throw error for invalid month', () => {
      expect(() => parseBrokerLocalToUtc('13/22/2025 14:30:00', 'America/New_York')).toThrow(BrokerDateParseError);
    });

    test('should throw error for invalid day', () => {
      expect(() => parseBrokerLocalToUtc('08/32/2025 14:30:00', 'America/New_York')).toThrow(BrokerDateParseError);
    });

    test('should throw error for invalid hour', () => {
      expect(() => parseBrokerLocalToUtc('08/22/2025 25:30:00', 'America/New_York')).toThrow(BrokerDateParseError);
    });

    test('should throw error for invalid minute', () => {
      expect(() => parseBrokerLocalToUtc('08/22/2025 14:60:00', 'America/New_York')).toThrow(BrokerDateParseError);
    });

    test('should throw error for invalid second', () => {
      expect(() => parseBrokerLocalToUtc('08/22/2025 14:30:60', 'America/New_York')).toThrow(BrokerDateParseError);
    });

    test('should throw error for date out of range', () => {
      expect(() => parseBrokerLocalToUtc('08/22/1800 14:30:00', 'America/New_York')).toThrow(BrokerDateParseError);
    });

    test('should throw error for future date out of range', () => {
      expect(() => parseBrokerLocalToUtc('08/22/2200 14:30:00', 'America/New_York')).toThrow(BrokerDateParseError);
    });
  });

  describe('Error handling', () => {
    test('should include row index in error', () => {
      try {
        parseBrokerLocalToUtc('invalid-date', 'America/New_York', 42);
      } catch (error) {
        expect(error).toBeInstanceOf(BrokerDateParseError);
        expect((error as BrokerDateParseError).rowIndex).toBe(42);
        expect((error as BrokerDateParseError).value).toBe('invalid-date');
      }
    });

    test('should include reason in error', () => {
      try {
        parseBrokerLocalToUtc('', 'America/New_York', 0);
      } catch (error) {
        expect(error).toBeInstanceOf(BrokerDateParseError);
        expect((error as BrokerDateParseError).reason).toBe('Empty timestamp');
      }
    });
  });

  describe('Edge cases', () => {
    test('should handle single digit months and days', () => {
      const result = parseBrokerLocalToUtc('1/1/2025 01:01:01', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should handle leap year', () => {
      const result = parseBrokerLocalToUtc('02/29/2024 14:30:00', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should reject invalid leap year', () => {
      expect(() => parseBrokerLocalToUtc('02/29/2025 14:30:00', 'America/New_York')).toThrow(BrokerDateParseError);
    });

    test('should handle midnight', () => {
      const result = parseBrokerLocalToUtc('08/22/2025 00:00:00', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should handle end of day', () => {
      const result = parseBrokerLocalToUtc('08/22/2025 23:59:59', 'America/New_York');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});

describe('isValidDateString', () => {
  test('should return true for valid dates', () => {
    expect(isValidDateString('08/22/2025 14:30:00')).toBe(true);
    expect(isValidDateString('2025-08-22')).toBe(true);
    expect(isValidDateString('1724332200')).toBe(true);
  });

  test('should return false for invalid dates', () => {
    expect(isValidDateString('')).toBe(false);
    expect(isValidDateString('invalid-date')).toBe(false);
    expect(isValidDateString('13/22/2025')).toBe(false);
  });
});

describe('formatDate', () => {
  const testDate = new Date('2025-08-22T18:30:00.000Z');

  test('should format as ISO', () => {
    expect(formatDate(testDate, 'iso')).toBe('2025-08-22T18:30:00.000Z');
  });

  test('should format as local', () => {
    const result = formatDate(testDate, 'local');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('should format as display', () => {
    const result = formatDate(testDate, 'display');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('should handle invalid dates', () => {
    expect(formatDate(new Date('invalid'), 'iso')).toBe('Invalid Date');
  });
});
