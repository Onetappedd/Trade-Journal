import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { processWebullCsv, parseWebullCsvHeaders } from '../webull';
import { upsertTrades } from '../upsertTrades';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: 'new-trade-id' }],
        error: null
      })
    })
  })
};

describe('Webull E2E Simple Tests', () => {
  let testCsvPath: string;
  let testCsvContent: string;

  beforeAll(() => {
    testCsvPath = join(process.cwd(), 'tests/fixtures/webull-mini.csv');
    testCsvContent = readFileSync(testCsvPath, 'utf-8');
  });

  describe('CSV Processing Pipeline', () => {
    it('should process test CSV and return comprehensive summary', () => {
      const headers = testCsvContent.split('\n')[0].split(',').map(h => h.trim());
      const fieldMap = parseWebullCsvHeaders(headers);
      
      const result = processWebullCsv(testCsvContent, fieldMap);
      
      // Verify processing results
      expect(result.summary.totalRows).toBe(9); // 8 data rows + 1 header
      expect(result.summary.headerRows).toBe(1);
      expect(result.summary.parsedRows).toBe(8);
      expect(result.summary.importedRows).toBeGreaterThan(0);
      expect(result.summary.importedRows).toBeLessThanOrEqual(8);
      
      // Verify error collection
      expect(Array.isArray(result.summary.errors)).toBe(true);
      expect(result.summary.errorSummary).toBeDefined();
      
      // Verify trade structure for valid trades
      if (result.trades.length > 0) {
        const trade = result.trades[0];
        expect(trade.externalId).toBeDefined();
        expect(trade.broker).toBe('webull');
        expect(trade.symbolRaw).toBeDefined();
        expect(trade.symbol).toBeDefined();
        expect(trade.assetType).toMatch(/^(option|equity)$/);
        expect(trade.side).toMatch(/^(buy|sell)$/);
        expect(typeof trade.quantity).toBe('number');
        expect(typeof trade.price).toBe('number');
        expect(trade.status).toBe('filled');
        expect(trade.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }
      
      // Verify skipped rows
      expect(Array.isArray(result.skippedRows)).toBe(true);
      expect(result.skippedRows.length).toBeLessThanOrEqual(5);
      
      if (result.skippedRows.length > 0) {
        const skipped = result.skippedRows[0];
        expect(skipped.rowIndex).toBeDefined();
        expect(skipped.reason).toBeDefined();
        expect(skipped.symbolRaw).toBeDefined();
      }
    });

    it('should handle all test scenarios correctly', () => {
      const headers = testCsvContent.split('\n')[0].split(',').map(h => h.trim());
      const fieldMap = parseWebullCsvHeaders(headers);
      
      const result = processWebullCsv(testCsvContent, fieldMap);
      
      // Should have processed all 8 data rows
      expect(result.summary.parsedRows).toBe(8);
      
      // Should have some valid trades (AAPL, TSLA option, SPY option)
      expect(result.summary.importedRows).toBeGreaterThanOrEqual(3);
      
      // Should have some skipped rows (cancelled, zero filled, bad date)
      expect(result.summary.skipped.cancelled).toBeGreaterThanOrEqual(2);
      expect(result.summary.skipped.zeroQty).toBeGreaterThanOrEqual(1);
      expect(result.summary.skipped.badDate).toBeGreaterThanOrEqual(1);
      
      // Verify specific trade types
      const equityTrades = result.trades.filter(t => t.assetType === 'equity');
      const optionTrades = result.trades.filter(t => t.assetType === 'option');
      
      expect(equityTrades.length).toBeGreaterThan(0);
      expect(optionTrades.length).toBeGreaterThan(0);
      
      // Verify option symbol decoding
      const optionTrade = optionTrades.find(t => t.symbolRaw.includes('TSLA250822C00325000'));
      if (optionTrade) {
        expect(optionTrade.symbol).toBe('TSLA 2025-08-22 325C');
        expect(optionTrade.assetType).toBe('option');
      }
    });

    it('should handle price cleaning correctly', () => {
      const headers = testCsvContent.split('\n')[0].split(',').map(h => h.trim());
      const fieldMap = parseWebullCsvHeaders(headers);
      
      const result = processWebullCsv(testCsvContent, fieldMap);
      
      // Find the trade with @ price
      const metaTrade = result.trades.find(t => t.symbolRaw === 'META');
      if (metaTrade) {
        expect(metaTrade.price).toBe(450.00); // Should clean @450.00 to 450.00
      }
    });
  });

  describe('Upsert Integration', () => {
    it('should convert trades to database records correctly', async () => {
      const headers = testCsvContent.split('\n')[0].split(',').map(h => h.trim());
      const fieldMap = parseWebullCsvHeaders(headers);
      const result = processWebullCsv(testCsvContent, fieldMap);
      
      // Test with a small subset of trades
      const testTrades = result.trades.slice(0, 2);
      
      const upsertResult = await upsertTrades(mockSupabase, 'test-user-id', testTrades);
      
      expect(upsertResult.inserted).toBe(2);
      expect(upsertResult.duplicatesSkipped).toBe(0);
      expect(upsertResult.errors).toBe(0);
      expect(upsertResult.summary.totalProcessed).toBe(2);
      expect(upsertResult.summary.newTrades).toBe(2);
    });

    it('should handle duplicate detection', async () => {
      const headers = testCsvContent.split('\n')[0].split(',').map(h => h.trim());
      const fieldMap = parseWebullCsvHeaders(headers);
      const result = processWebullCsv(testCsvContent, fieldMap);
      
      const testTrades = result.trades.slice(0, 1);
      
      // Mock existing trades
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ idempotency_key: 'existing-key' }],
              error: null
            })
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });
      
      const upsertResult = await upsertTrades(mockSupabase, 'test-user-id', testTrades);
      
      expect(upsertResult.inserted).toBe(0);
      expect(upsertResult.duplicatesSkipped).toBe(1);
      expect(upsertResult.errors).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should collect and categorize errors correctly', () => {
      const headers = testCsvContent.split('\n')[0].split(',').map(h => h.trim());
      const fieldMap = parseWebullCsvHeaders(headers);
      
      const result = processWebullCsv(testCsvContent, fieldMap);
      
      // Verify error collection
      expect(Array.isArray(result.summary.errors)).toBe(true);
      expect(result.summary.errorSummary).toBeDefined();
      
      // Verify error structure
      if (result.summary.errors.length > 0) {
        const error = result.summary.errors[0];
        expect(error.rowIndex).toBeDefined();
        expect(error.code).toBeDefined();
        expect(error.message).toBeDefined();
        expect(error.symbolRaw).toBeDefined();
      }
      
      // Verify error summary totals
      const totalErrors = Object.values(result.summary.errorSummary).reduce((sum, count) => sum + count, 0);
      expect(totalErrors).toBe(result.summary.errors.length);
    });

    it('should provide actionable error messages', () => {
      const headers = testCsvContent.split('\n')[0].split(',').map(h => h.trim());
      const fieldMap = parseWebullCsvHeaders(headers);
      
      const result = processWebullCsv(testCsvContent, fieldMap);
      
      // Check that error messages are user-friendly
      result.summary.errors.forEach(error => {
        expect(error.message).not.toContain('stack');
        expect(error.message).not.toContain('undefined');
        expect(error.message).not.toContain('null');
        expect(error.message.length).toBeGreaterThan(20);
      });
    });
  });
});

