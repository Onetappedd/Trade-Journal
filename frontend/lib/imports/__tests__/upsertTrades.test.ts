import { describe, test, expect, vi } from 'vitest';
import { 
  generateIdempotencyKey, 
  convertToTradeRecord, 
  checkTradeExists,
  upsertSingleTrade,
  upsertTrades,
  batchUpsertTrades,
  getExistingTrades,
  coerceNumber,
  TradeRecord,
  UpsertResult
} from '../upsertTrades';
import { WebullTradeDTO } from '../webull';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [{ id: 'test-id' }], error: null }))
    }))
  }))
};

describe('coerceNumber', () => {
  test('should parse clean numbers', () => {
    expect(coerceNumber('123.45')).toBe(123.45);
    expect(coerceNumber(123.45)).toBe(123.45);
    expect(coerceNumber('0')).toBe(0);
    expect(coerceNumber('0.0')).toBe(0);
  });

  test('should handle price formatting with @ symbol', () => {
    expect(coerceNumber('@3.51')).toBe(3.51);
    expect(coerceNumber(' @3.51 ')).toBe(3.51);
    expect(coerceNumber('@ 3.51')).toBe(3.51);
  });

  test('should handle dollar signs', () => {
    expect(coerceNumber('$123.45')).toBe(123.45);
    expect(coerceNumber(' $123.45 ')).toBe(123.45);
    expect(coerceNumber('$ 123.45')).toBe(123.45);
  });

  test('should handle commas in numbers', () => {
    expect(coerceNumber('1,234.56')).toBe(1234.56);
    expect(coerceNumber('1,234,567.89')).toBe(1234567.89);
    expect(coerceNumber('1,234')).toBe(1234);
  });

  test('should handle spaces', () => {
    expect(coerceNumber(' 123.45 ')).toBe(123.45);
    expect(coerceNumber(' 1 2 3 . 4 5 ')).toBe(123.45);
    expect(coerceNumber('123 456')).toBe(123456);
  });

  test('should handle combined formatting', () => {
    expect(coerceNumber(' $1,234.56 ')).toBe(1234.56);
    expect(coerceNumber('@ $1,234.56 ')).toBe(1234.56);
    expect(coerceNumber(' $ 1,234.56 ')).toBe(1234.56);
  });

  test('should handle negative numbers', () => {
    expect(coerceNumber('-123.45')).toBe(-123.45);
    expect(coerceNumber(' -123.45 ')).toBe(-123.45);
    expect(coerceNumber('$-123.45')).toBe(-123.45);
  });

  test('should handle decimal numbers', () => {
    expect(coerceNumber('0.01')).toBe(0.01);
    expect(coerceNumber('.01')).toBe(0.01);
    expect(coerceNumber('123.')).toBe(123);
  });

  test('should return null for invalid inputs', () => {
    expect(coerceNumber('')).toBe(null);
    expect(coerceNumber('   ')).toBe(null);
    expect(coerceNumber('-')).toBe(null);
    expect(coerceNumber('abc')).toBe(null);
    expect(coerceNumber('not a number')).toBe(null);
    expect(coerceNumber('$')).toBe(null);
    expect(coerceNumber('@')).toBe(null);
    expect(coerceNumber(',')).toBe(null);
  });

  test('should handle null and undefined', () => {
    expect(coerceNumber(null)).toBe(null);
    expect(coerceNumber(undefined)).toBe(null);
  });

  test('should handle edge cases', () => {
    expect(coerceNumber('0.0')).toBe(0);
    expect(coerceNumber('00.00')).toBe(0);
    expect(coerceNumber('000')).toBe(0);
    expect(coerceNumber('1e5')).toBe(100000);
    expect(coerceNumber('1E5')).toBe(100000);
  });

  test('should handle scientific notation', () => {
    expect(coerceNumber('1.23e4')).toBe(12300);
    expect(coerceNumber('1.23E-2')).toBe(0.0123);
  });

  test('should handle very large numbers', () => {
    expect(coerceNumber('999999999.99')).toBe(999999999.99);
    expect(coerceNumber('1,000,000,000')).toBe(1000000000);
  });

  test('should handle very small numbers', () => {
    expect(coerceNumber('0.000001')).toBe(0.000001);
    expect(coerceNumber('0.0000001')).toBe(0.0000001);
  });
});

describe('generateIdempotencyKey', () => {
  test('should generate key with external ID', () => {
    const key = generateIdempotencyKey(
      'webull',
      'ext-123',
      'TSLA250822C00325000',
      '2025-08-22T18:30:00.000Z',
      'buy',
      325.0,
      1
    );
    
    expect(key).toHaveLength(32);
    expect(key).toMatch(/^[a-f0-9]{32}$/);
  });

  test('should generate key without external ID', () => {
    const key = generateIdempotencyKey(
      'webull',
      null,
      'TSLA250822C00325000',
      '2025-08-22T18:30:00.000Z',
      'buy',
      325.0,
      1
    );
    
    expect(key).toHaveLength(32);
    expect(key).toMatch(/^[a-f0-9]{32}$/);
  });

  test('should generate consistent keys for same input', () => {
    const key1 = generateIdempotencyKey('webull', 'ext-123', 'TSLA', '2025-08-22T18:30:00.000Z', 'buy', 325.0, 1);
    const key2 = generateIdempotencyKey('webull', 'ext-123', 'TSLA', '2025-08-22T18:30:00.000Z', 'buy', 325.0, 1);
    
    expect(key1).toBe(key2);
  });

  test('should generate different keys for different inputs', () => {
    const key1 = generateIdempotencyKey('webull', 'ext-123', 'TSLA', '2025-08-22T18:30:00.000Z', 'buy', 325.0, 1);
    const key2 = generateIdempotencyKey('webull', 'ext-124', 'TSLA', '2025-08-22T18:30:00.000Z', 'buy', 325.0, 1);
    
    expect(key1).not.toBe(key2);
  });
});

describe('convertToTradeRecord', () => {
  const mockTradeDTO: WebullTradeDTO = {
    externalId: 'ext-123',
    broker: 'webull',
    symbolRaw: 'TSLA250822C00325000',
    symbol: 'TSLA 2025-08-22 325C',
    assetType: 'option',
    side: 'buy',
    quantity: 1,
    price: 325.0,
    fees: 0.65,
    commission: 0.0,
    status: 'filled',
    executedAt: '2025-08-22T18:30:00.000Z',
    meta: {
      rowIndex: 1,
      raw: {},
      source: 'webull-csv'
    }
  };

  test('should convert WebullTradeDTO to TradeRecord', () => {
    const result = convertToTradeRecord(mockTradeDTO, 'user-123');
    
    expect(result).toEqual({
      user_id: 'user-123',
      broker: 'webull',
      external_id: 'ext-123',
      idempotency_key: expect.any(String),
      asset_type: 'option',
      symbol: 'TSLA 2025-08-22 325C',
      symbol_raw: 'TSLA250822C00325000',
      side: 'buy',
      qty: 1,
      price: 325.0,
      fees: 0.65,
      commission: 0.0,
      executed_at: '2025-08-22T18:30:00.000Z',
      meta: {
        rowIndex: 1,
        raw: {},
        source: 'webull-csv',
        originalBroker: 'webull',
        importTimestamp: expect.any(String),
        originalQuantity: 1,
        originalSide: 'buy',
        originalPrice: 325.0,
        originalFees: 0.65,
        originalCommission: 0.0
      }
    });
  });

  test('should generate idempotency key', () => {
    const result = convertToTradeRecord(mockTradeDTO, 'user-123');
    
    expect(result.idempotency_key).toHaveLength(32);
    expect(result.idempotency_key).toMatch(/^[a-f0-9]{32}$/);
  });

  test('should handle negative quantity by storing absolute value', () => {
    const negativeTradeDTO = { ...mockTradeDTO, quantity: -5 };
    const result = convertToTradeRecord(negativeTradeDTO, 'user-123');
    
    expect(result.qty).toBe(5); // Should be positive
    expect(result.side).toBe('buy'); // Should remain buy
    expect(result.meta.originalQuantity).toBe(-5); // Original preserved
  });

  test('should handle sell side correctly', () => {
    const sellTradeDTO = { ...mockTradeDTO, side: 'sell' as const };
    const result = convertToTradeRecord(sellTradeDTO, 'user-123');
    
    expect(result.side).toBe('sell');
    expect(result.qty).toBe(1); // Should be positive
    expect(result.meta.originalSide).toBe('sell');
  });

  test('should handle invalid side by defaulting to buy', () => {
    const invalidSideTradeDTO = { ...mockTradeDTO, side: 'invalid' as any };
    const result = convertToTradeRecord(invalidSideTradeDTO, 'user-123');
    
    expect(result.side).toBe('buy'); // Should default to buy
    expect(result.meta.originalSide).toBe('invalid');
  });

  test('should safely handle blank fees and commission', () => {
    const blankFeesTradeDTO = { 
      ...mockTradeDTO, 
      fees: '', 
      commission: null 
    };
    const result = convertToTradeRecord(blankFeesTradeDTO, 'user-123');
    
    expect(result.fees).toBe(0);
    expect(result.commission).toBe(0);
  });

  test('should safely handle string fees and commission', () => {
    const stringFeesTradeDTO = { 
      ...mockTradeDTO, 
      fees: '1.25', 
      commission: '0.50' 
    };
    const result = convertToTradeRecord(stringFeesTradeDTO, 'user-123');
    
    expect(result.fees).toBe(1.25);
    expect(result.commission).toBe(0.50);
  });

  test('should safely handle invalid numeric fees and commission', () => {
    const invalidFeesTradeDTO = { 
      ...mockTradeDTO, 
      fees: 'invalid', 
      commission: 'not-a-number' 
    };
    const result = convertToTradeRecord(invalidFeesTradeDTO, 'user-123');
    
    expect(result.fees).toBe(0);
    expect(result.commission).toBe(0);
  });

  test('should handle formatted price strings', () => {
    const formattedTradeDTO = { 
      ...mockTradeDTO, 
      price: ' @3.51 ',
      fees: '$1.25',
      commission: '1,234.56'
    };
    const result = convertToTradeRecord(formattedTradeDTO, 'user-123');
    
    expect(result.price).toBe(3.51);
    expect(result.fees).toBe(1.25);
    expect(result.commission).toBe(1234.56);
    expect(result.meta.originalPrice).toBe(' @3.51 ');
    expect(result.meta.originalFees).toBe('$1.25');
    expect(result.meta.originalCommission).toBe('1,234.56');
  });

  test('should handle invalid price with fallback to 0', () => {
    const invalidPriceTradeDTO = { 
      ...mockTradeDTO, 
      price: 'invalid',
      quantity: 'not-a-number'
    };
    const result = convertToTradeRecord(invalidPriceTradeDTO, 'user-123');
    
    expect(result.price).toBe(0);
    expect(result.qty).toBe(0);
  });
});

describe('checkTradeExists', () => {
  test('should return false when no trade exists', async () => {
    const result = await checkTradeExists(mockSupabase, 'user-123', 'key-123');
    expect(result).toBe(false);
  });

  test('should return true when trade exists', async () => {
    const mockSupabaseWithData = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [{ id: 'test-id' }], error: null }))
            }))
          }))
        }))
      }))
    };

    const result = await checkTradeExists(mockSupabaseWithData, 'user-123', 'key-123');
    expect(result).toBe(true);
  });

  test('should return false on error', async () => {
    const mockSupabaseWithError = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
            }))
          }))
        }))
      }))
    };

    const result = await checkTradeExists(mockSupabaseWithError, 'user-123', 'key-123');
    expect(result).toBe(false);
  });
});

describe('upsertSingleTrade', () => {
  const mockTradeRecord: TradeRecord = {
    user_id: 'user-123',
    broker: 'webull',
    external_id: 'ext-123',
    idempotency_key: 'key-123',
    asset_type: 'option',
    symbol: 'TSLA 2025-08-22 325C',
    symbol_raw: 'TSLA250822C00325000',
    side: 'buy',
    qty: 1,
    price: 325.0,
    fees: 0.65,
    commission: 0.0,
    executed_at: '2025-08-22T18:30:00.000Z',
    meta: {}
  };

  test('should insert new trade successfully', async () => {
    const result = await upsertSingleTrade(mockSupabase, mockTradeRecord);
    
    expect(result).toEqual({
      success: true,
      isDuplicate: false
    });
  });

  test('should skip duplicate trade', async () => {
    const mockSupabaseWithExisting = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [{ id: 'existing-id' }], error: null }))
            }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [{ id: 'test-id' }], error: null }))
        }))
      }))
    };

    const result = await upsertSingleTrade(mockSupabaseWithExisting, mockTradeRecord);
    
    expect(result).toEqual({
      success: true,
      isDuplicate: true
    });
  });

  test('should handle insert error', async () => {
    const mockSupabaseWithError = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Insert failed' } }))
        }))
      }))
    };

    const result = await upsertSingleTrade(mockSupabaseWithError, mockTradeRecord);
    
    expect(result).toEqual({
      success: false,
      isDuplicate: false,
      error: 'Insert failed'
    });
  });
});

describe('upsertTrades', () => {
  const mockTradeDTOs: WebullTradeDTO[] = [
    {
      externalId: 'ext-1',
      broker: 'webull',
      symbolRaw: 'TSLA250822C00325000',
      symbol: 'TSLA 2025-08-22 325C',
      assetType: 'option',
      side: 'buy',
      quantity: 1,
      price: 325.0,
      fees: 0.65,
      commission: 0.0,
      status: 'filled',
      executedAt: '2025-08-22T18:30:00.000Z',
      meta: { rowIndex: 1, raw: {}, source: 'webull-csv' }
    },
    {
      externalId: 'ext-2',
      broker: 'webull',
      symbolRaw: 'AAPL',
      symbol: 'AAPL',
      assetType: 'equity',
      side: 'sell',
      quantity: 10,
      price: 150.0,
      fees: 1.50,
      commission: 0.0,
      status: 'cancelled',
      executedAt: '2025-08-22T18:30:00.000Z',
      meta: { rowIndex: 2, raw: {}, source: 'webull-csv' }
    }
  ];

  test('should upsert multiple trades', async () => {
    const result = await upsertTrades(mockSupabase, mockTradeDTOs, 'user-123');
    
    expect(result).toEqual({
      inserted: 1, // Only filled trade
      skipped: 1,  // Cancelled trade
      duplicatesSkipped: 0,
      errors: 0,
      summary: {
        totalProcessed: 2,
        newTrades: 1,
        duplicateTrades: 0,
        errorTrades: 0
      }
    });
  });

  test('should handle empty array', async () => {
    const result = await upsertTrades(mockSupabase, [], 'user-123');
    
    expect(result).toEqual({
      inserted: 0,
      skipped: 0,
      duplicatesSkipped: 0,
      errors: 0,
      summary: {
        totalProcessed: 0,
        newTrades: 0,
        duplicateTrades: 0,
        errorTrades: 0
      }
    });
  });
});

describe('batchUpsertTrades', () => {
  const mockTradeDTOs: WebullTradeDTO[] = Array.from({ length: 100 }, (_, i) => ({
    externalId: `ext-${i}`,
    broker: 'webull',
    symbolRaw: 'TSLA',
    symbol: 'TSLA',
    assetType: 'equity',
    side: 'buy',
    quantity: 1,
    price: 100.0,
    fees: 1.0,
    commission: 0.0,
    status: 'filled',
    executedAt: '2025-08-22T18:30:00.000Z',
    meta: { rowIndex: i, raw: {}, source: 'webull-csv' }
  }));

  test('should process trades in batches', async () => {
    const result = await batchUpsertTrades(mockSupabase, mockTradeDTOs, 'user-123', 25);
    
    expect(result.summary.totalProcessed).toBe(100);
    expect(result.inserted).toBe(100);
    expect(result.errors).toBe(0);
  });

  test('should handle batch errors', async () => {
    const mockSupabaseWithError = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Batch error' } }))
        }))
      }))
    };

    const result = await batchUpsertTrades(mockSupabaseWithError, mockTradeDTOs.slice(0, 10), 'user-123', 5);
    
    expect(result.summary.totalProcessed).toBe(10);
    expect(result.errors).toBe(10);
  });
});

describe('getExistingTrades', () => {
  test('should return set of existing idempotency keys', async () => {
    const mockSupabaseWithData = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ 
              data: [
                { idempotency_key: 'key-1' },
                { idempotency_key: 'key-2' }
              ], 
              error: null 
            }))
          }))
        }))
      }))
    };

    const result = await getExistingTrades(mockSupabaseWithData, 'user-123', ['key-1', 'key-2', 'key-3']);
    
    expect(result).toEqual(new Set(['key-1', 'key-2']));
  });

  test('should return empty set on error', async () => {
    const mockSupabaseWithError = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
          }))
        }))
      }))
    };

    const result = await getExistingTrades(mockSupabaseWithError, 'user-123', ['key-1', 'key-2']);
    
    expect(result).toEqual(new Set());
  });
});
