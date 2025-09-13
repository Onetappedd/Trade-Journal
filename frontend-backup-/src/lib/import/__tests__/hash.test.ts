import { describe, it, expect } from 'vitest';
import { rowHash } from '../hash';

describe('rowHash', () => {
  it('should produce same hash for same object with different key order', async () => {
    const obj1 = {
      symbol: 'AAPL',
      side: 'BUY',
      quantity: 100,
      price: 150.50
    };
    
    const obj2 = {
      price: 150.50,
      symbol: 'AAPL',
      quantity: 100,
      side: 'BUY'
    };
    
    const hash1 = await rowHash(obj1);
    const hash2 = await rowHash(obj2);
    
    expect(hash1).toBe(hash2);
  });

  it('should produce same hash for strings with extra spaces and different casing', async () => {
    const obj1 = {
      symbol: '  AAPL  ',
      side: 'buy',
      option_type: 'CALL',
      open_close: '  OPEN  ',
      venue: 'NASDAQ',
      source: 'WEBULL'
    };
    
    const obj2 = {
      symbol: 'aapl',
      side: 'BUY',
      option_type: 'call',
      open_close: 'open',
      venue: 'nasdaq',
      source: 'webull'
    };
    
    const hash1 = await rowHash(obj1);
    const hash2 = await rowHash(obj2);
    
    expect(hash1).toBe(hash2);
  });

  it('should handle null and undefined values consistently', async () => {
    const obj1 = {
      symbol: 'AAPL',
      side: 'BUY',
      quantity: 100,
      price: 150.50,
      fees: null,
      venue: undefined
    };
    
    const obj2 = {
      symbol: 'AAPL',
      side: 'BUY',
      quantity: 100,
      price: 150.50
    };
    
    const hash1 = await rowHash(obj1);
    const hash2 = await rowHash(obj2);
    
    expect(hash1).toBe(hash2);
  });

  it('should handle nested objects recursively', async () => {
    const obj1 = {
      symbol: 'AAPL',
      metadata: {
        source: 'WEBULL',
        timestamp: '2024-01-01'
      }
    };
    
    const obj2 = {
      metadata: {
        timestamp: '2024-01-01',
        source: 'webull'
      },
      symbol: 'aapl'
    };
    
    const hash1 = await rowHash(obj1);
    const hash2 = await rowHash(obj2);
    
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different data', async () => {
    const obj1 = {
      symbol: 'AAPL',
      side: 'BUY',
      quantity: 100
    };
    
    const obj2 = {
      symbol: 'AAPL',
      side: 'SELL',
      quantity: 100
    };
    
    const hash1 = await rowHash(obj1);
    const hash2 = await rowHash(obj2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should return a hex string', async () => {
    const obj = {
      symbol: 'AAPL',
      side: 'BUY',
      quantity: 100
    };
    
    const hash = await rowHash(obj);
    
    expect(hash).toMatch(/^[0-9a-f]+$/);
    expect(hash.length).toBe(64); // SHA-256 hex string length
  });
});
