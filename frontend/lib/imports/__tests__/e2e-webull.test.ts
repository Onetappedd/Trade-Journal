import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock Supabase client for testing
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
  },
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

// Mock the Supabase client creation
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue(mockSupabase)
}));

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue({ value: 'mock-cookie' })
  })
}));

describe('Webull E2E Tests', () => {
  let testCsvPath: string;
  let testCsvContent: string;

  beforeAll(() => {
    testCsvPath = join(process.cwd(), 'tests/fixtures/webull-mini.csv');
    testCsvContent = readFileSync(testCsvPath, 'utf-8');
  });

  describe('CSV Test Endpoint', () => {
    it('should analyze CSV and return comprehensive summary', async () => {
      const formData = new FormData();
      const blob = new Blob([testCsvContent], { type: 'text/csv' });
      formData.append('file', blob, 'webull-mini.csv');

      const response = await fetch('http://localhost:3000/api/test-webull-import-simple', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(response.ok).toBe(true);
      
      const result = await response.json();
      
      // Verify response structure
      expect(result.success).toBe(true);
      expect(result.profiling).toBeDefined();
      expect(result.importableTradesPreview).toBeDefined();
      expect(result.skippedRowsPreview).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.errorSummary).toBeDefined();
      
      // Verify profiling data
      expect(result.profiling.totalRows).toBe(9); // 8 data rows + 1 header
      expect(result.profiling.headerRows).toBe(1);
      expect(result.profiling.parsedRows).toBe(8);
      expect(result.profiling.importedRows).toBeGreaterThan(0);
      expect(result.profiling.importedRows).toBeLessThanOrEqual(8);
      
      // Verify error summary
      expect(result.errorSummary).toBeDefined();
      expect(typeof result.errorSummary.PARSE_ERROR).toBe('number');
      expect(typeof result.errorSummary.BAD_DATE).toBe('number');
      expect(typeof result.errorSummary.ZERO_QTY).toBe('number');
      expect(typeof result.errorSummary.CANCELLED).toBe('number');
      
      // Verify importable trades preview
      expect(Array.isArray(result.importableTradesPreview)).toBe(true);
      expect(result.importableTradesPreview.length).toBeGreaterThan(0);
      expect(result.importableTradesPreview.length).toBeLessThanOrEqual(10);
      
      // Verify skipped rows preview
      expect(Array.isArray(result.skippedRowsPreview)).toBe(true);
      expect(result.skippedRowsPreview.length).toBeLessThanOrEqual(10);
      
      // Verify trade structure
      if (result.importableTradesPreview.length > 0) {
        const trade = result.importableTradesPreview[0];
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
    });

    it('should handle invalid CSV gracefully', async () => {
      const formData = new FormData();
      const blob = new Blob(['invalid,csv,data'], { type: 'text/csv' });
      formData.append('file', blob, 'invalid.csv');

      const response = await fetch('http://localhost:3000/api/test-webull-import-simple', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      // Should still return a response, even if with errors
      expect(response.status).toBeLessThan(500);
      
      const result = await response.json();
      expect(result).toBeDefined();
    });
  });

  describe('CSV Final Import Endpoint', () => {
    it('should import valid trades to database', async () => {
      const formData = new FormData();
      const blob = new Blob([testCsvContent], { type: 'text/csv' });
      formData.append('file', blob, 'webull-mini.csv');
      formData.append('data', JSON.stringify({
        fileName: 'webull-mini.csv',
        fileSize: testCsvContent.length,
        broker: 'webull',
        options: {
          skipDuplicates: true,
          normalizeTimestamps: true,
          mapFees: true
        }
      }));

      const response = await fetch('http://localhost:3000/api/import/csv-webull-final', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(response.ok).toBe(true);
      
      const result = await response.json();
      
      // Verify response structure
      expect(result.success).toBe(true);
      expect(result.profiling).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.errorSummary).toBeDefined();
      
      // Verify stats
      expect(typeof result.stats.totalRows).toBe('number');
      expect(typeof result.stats.inserted).toBe('number');
      expect(typeof result.stats.duplicatesSkipped).toBe('number');
      expect(typeof result.stats.skipped).toBe('number');
      expect(typeof result.stats.errors).toBe('number');
      
      // Verify that some trades were inserted
      expect(result.stats.inserted).toBeGreaterThan(0);
      
      // Verify database insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('trades');
    });

    it('should skip duplicates on second run', async () => {
      // First import
      const formData1 = new FormData();
      const blob1 = new Blob([testCsvContent], { type: 'text/csv' });
      formData1.append('file', blob1, 'webull-mini.csv');
      formData1.append('data', JSON.stringify({
        fileName: 'webull-mini.csv',
        fileSize: testCsvContent.length,
        broker: 'webull'
      }));

      const response1 = await fetch('http://localhost:3000/api/import/csv-webull-final', {
        method: 'POST',
        body: formData1,
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(response1.ok).toBe(true);
      const result1 = await response1.json();
      const firstRunInserted = result1.stats.inserted;

      // Mock existing trades for second run
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ idempotency_key: 'existing-key-1' }, { idempotency_key: 'existing-key-2' }],
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

      // Second import (should skip duplicates)
      const formData2 = new FormData();
      const blob2 = new Blob([testCsvContent], { type: 'text/csv' });
      formData2.append('file', blob2, 'webull-mini.csv');
      formData2.append('data', JSON.stringify({
        fileName: 'webull-mini.csv',
        fileSize: testCsvContent.length,
        broker: 'webull'
      }));

      const response2 = await fetch('http://localhost:3000/api/import/csv-webull-final', {
        method: 'POST',
        body: formData2,
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(response2.ok).toBe(true);
      const result2 = await response2.json();
      
      // Second run should have fewer or zero new insertions
      expect(result2.stats.inserted).toBeLessThanOrEqual(firstRunInserted);
      expect(result2.stats.duplicatesSkipped).toBeGreaterThan(0);
    });

    it('should handle authentication errors', async () => {
      // Mock authentication failure
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Authentication failed' }
      });

      const formData = new FormData();
      const blob = new Blob([testCsvContent], { type: 'text/csv' });
      formData.append('file', blob, 'webull-mini.csv');

      const response = await fetch('http://localhost:3000/api/import/csv-webull-final', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.status).toBe(401);
      
      const result = await response.json();
      expect(result.error).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      });

      const formData = new FormData();
      const blob = new Blob([testCsvContent], { type: 'text/csv' });
      formData.append('file', blob, 'webull-mini.csv');

      const response = await fetch('http://localhost:3000/api/import/csv-webull-final', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      // Should handle error gracefully
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should collect and categorize errors correctly', async () => {
      const formData = new FormData();
      const blob = new Blob([testCsvContent], { type: 'text/csv' });
      formData.append('file', blob, 'webull-mini.csv');

      const response = await fetch('http://localhost:3000/api/test-webull-import-simple', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(response.ok).toBe(true);
      
      const result = await response.json();
      
      // Verify error collection
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errorSummary).toBeDefined();
      
      // Verify error structure
      if (result.errors.length > 0) {
        const error = result.errors[0];
        expect(error.rowIndex).toBeDefined();
        expect(error.code).toBeDefined();
        expect(error.message).toBeDefined();
        expect(error.symbolRaw).toBeDefined();
      }
      
      // Verify error summary totals
      const totalErrors = Object.values(result.errorSummary).reduce((sum, count) => sum + count, 0);
      expect(totalErrors).toBe(result.errors.length);
    });
  });

  afterAll(() => {
    // Clean up mocks
    vi.clearAllMocks();
  });
});
