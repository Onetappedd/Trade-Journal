import { describe, it, expect, vi } from 'vitest';
import { logWebullImport, webullLogger } from '../logger';

// We need to test the PII masking function directly
// Since it's not exported, we'll create a test that imports the logger module
// and tests the masking behavior through the logging functions

describe('PII Masking', () => {
  it('should mask email addresses', () => {
    const mockLogger = {
      info: vi.fn()
    };
    
    // Mock the webullLogger
    (webullLogger as any).info = mockLogger.info;

    const dataWithEmail = {
      email: 'user@example.com',
      userId: 'user-123',
      otherData: 'safe data'
    };

    logWebullImport('info', 'Test with email', dataWithEmail);
    
    // Check that the email was masked
    expect(mockLogger.info).toHaveBeenCalledWith(
      { 
        data: {
          email: 'us***om',
          userId: 'us***23',
          otherData: 'safe data'
        }
      },
      'Test with email'
    );
  });

  it('should mask phone numbers', () => {
    const mockLogger = {
      info: vi.fn()
    };
    
    (webullLogger as any).info = mockLogger.info;

    const dataWithPhone = {
      phone: '555-123-4567',
      phoneNumber: '5551234567',
      otherData: 'safe data'
    };

    logWebullImport('info', 'Test with phone', dataWithPhone);
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      { 
        data: {
          phone: '55***67',
          phoneNumber: '55***67',
          otherData: 'safe data'
        }
      },
      'Test with phone'
    );
  });

  it('should mask names', () => {
    const mockLogger = {
      info: vi.fn()
    };
    
    (webullLogger as any).info = mockLogger.info;

    const dataWithNames = {
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Michael Doe',
      otherData: 'safe data'
    };

    logWebullImport('info', 'Test with names', dataWithNames);
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      { 
        data: {
          name: 'Jo***oe',
          firstName: '***',
          lastName: '***',
          fullName: 'Jo***oe',
          otherData: 'safe data'
        }
      },
      'Test with names'
    );
  });

  it('should mask short strings completely', () => {
    const mockLogger = {
      info: vi.fn()
    };
    
    (webullLogger as any).info = mockLogger.info;

    const dataWithShortStrings = {
      name: 'Jo',
      email: 'a@b',
      otherData: 'safe data'
    };

    logWebullImport('info', 'Test with short strings', dataWithShortStrings);
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      { 
        data: {
          name: '***',
          email: '***',
          otherData: 'safe data'
        }
      },
      'Test with short strings'
    );
  });

  it('should mask nested objects', () => {
    const mockLogger = {
      info: vi.fn()
    };
    
    (webullLogger as any).info = mockLogger.info;

    const dataWithNestedPII = {
      user: {
        email: 'user@example.com',
        name: 'John Doe',
        id: 'user-123'
      },
      otherData: 'safe data'
    };

    logWebullImport('info', 'Test with nested PII', dataWithNestedPII);
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      { 
        data: {
          user: {
            email: 'us***om',
            name: 'Jo***oe',
            id: 'us***23'
          },
          otherData: 'safe data'
        }
      },
      'Test with nested PII'
    );
  });

  it('should not mask non-PII fields', () => {
    const mockLogger = {
      info: vi.fn()
    };
    
    (webullLogger as any).info = mockLogger.info;

    const safeData = {
      symbol: 'AAPL',
      price: 150.50,
      quantity: 100,
      status: 'filled',
      executedAt: '2025-01-01T10:00:00Z',
      meta: {
        rowIndex: 1,
        source: 'webull-csv'
      }
    };

    logWebullImport('info', 'Test with safe data', safeData);
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      { 
        data: safeData
      },
      'Test with safe data'
    );
  });

  it('should handle null and undefined values', () => {
    const mockLogger = {
      info: vi.fn()
    };
    
    (webullLogger as any).info = mockLogger.info;

    const dataWithNulls = {
      email: null,
      name: undefined,
      userId: '',
      otherData: 'safe data'
    };

    logWebullImport('info', 'Test with nulls', dataWithNulls);
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      { 
        data: {
          email: '***',
          name: undefined,
          userId: '***',
          otherData: 'safe data'
        }
      },
      'Test with nulls'
    );
  });
});
