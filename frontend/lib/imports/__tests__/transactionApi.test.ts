import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../../app/api/import/csv-webull-final/route';

// Mock all dependencies
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn()
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'test-cookie' }))
  }))
}));

vi.mock('../webull', () => ({
  parseWebullCsvHeaders: vi.fn(() => ({
    symbol: 'symbol',
    action: 'action',
    status: 'status',
    filled: 'filled',
    quantity: 'quantity',
    price: 'price',
    executedTime: 'executedTime',
    orderId: 'orderId',
    commission: 'commission',
    fees: 'fees'
  })),
  processWebullCsv: vi.fn()
}));

vi.mock('../transactionWrapper', () => ({
  executeImportTransaction: vi.fn(),
  createTransactionErrorResponse: vi.fn(),
  createTransactionSuccessResponse: vi.fn()
}));

vi.mock('../logger', () => ({
  logImportStart: vi.fn(),
  logImportSummary: vi.fn(),
  logImportErrors: vi.fn(),
  logImportComplete: vi.fn(),
  logImportError: vi.fn()
}));

describe('Transaction API', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(() => ({
          data: { user: { id: 'test-user' } },
          error: null
        }))
      }
    };

    // Mock the createServerClient function
    const { createServerClient } = require('@supabase/ssr');
    vi.mocked(createServerClient).mockReturnValue(mockSupabase);

    // Mock request with FormData
    const formData = new FormData();
    formData.append('file', new Blob(['test,data\n1,2'], { type: 'text/csv' }), 'test.csv');
    
    mockRequest = new NextRequest('http://localhost:3000/api/import/csv-webull-final', {
      method: 'POST',
      body: formData
    });
  });

  it('should handle successful transaction', async () => {
    const { processWebullCsv } = await import('../webull');
    const { executeImportTransaction } = await import('../transactionWrapper');
    const { createTransactionSuccessResponse } = await import('../transactionWrapper');

    // Mock CSV processing
    vi.mocked(processWebullCsv).mockReturnValue({
      trades: [
        {
          externalId: 'order123',
          broker: 'webull',
          symbolRaw: 'AAPL',
          symbol: 'AAPL',
          assetType: 'equity',
          side: 'buy',
          quantity: 100,
          price: 150.50,
          fees: 1.00,
          commission: 0.00,
          status: 'filled',
          executedAt: '2025-01-28T10:00:00Z',
          meta: { rowIndex: 1, raw: {}, source: 'webull-csv' }
        }
      ],
      summary: {
        totalRows: 2,
        headerRows: 1,
        parsedRows: 1,
        filledRows: 1,
        importedRows: 1,
        skipped: {
          cancelled: 0,
          zeroQty: 0,
          zeroPrice: 0,
          badDate: 0,
          parseError: 0
        },
        errors: [],
        errorSummary: {}
      },
      skippedRows: []
    });

    // Mock successful transaction
    vi.mocked(executeImportTransaction).mockResolvedValue({
      success: true,
      result: {
        inserted: 1,
        skipped: 0,
        duplicatesSkipped: 0,
        errors: 0,
        summary: {
          totalProcessed: 1,
          newTrades: 1,
          duplicateTrades: 0,
          errorTrades: 0
        }
      }
    });

    // Mock success response
    const mockSuccessResponse = {
      success: true,
      message: 'Webull CSV import completed successfully',
      profiling: {
        totalRows: 2,
        headerRows: 1,
        parsedRows: 1,
        filledRows: 1,
        importedRows: 1,
        skipped: {
          cancelled: 0,
          zeroQty: 0,
          zeroPrice: 0,
          badDate: 0,
          parseError: 0
        }
      },
      stats: {
        totalRows: 2,
        inserted: 1,
        duplicatesSkipped: 0,
        skipped: 0,
        errors: 0
      },
      errors: [],
      errorSummary: {},
      skippedRows: []
    };

    vi.mocked(createTransactionSuccessResponse).mockReturnValue(mockSuccessResponse);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Webull CSV import completed successfully');
    expect(data.stats.inserted).toBe(1);
  });

  it('should handle transaction failure with rollback', async () => {
    const { processWebullCsv } = await import('../webull');
    const { executeImportTransaction } = await import('../transactionWrapper');
    const { createTransactionErrorResponse } = await import('../transactionWrapper');

    // Mock CSV processing
    vi.mocked(processWebullCsv).mockReturnValue({
      trades: [
        {
          externalId: 'order123',
          broker: 'webull',
          symbolRaw: 'AAPL',
          symbol: 'AAPL',
          assetType: 'equity',
          side: 'buy',
          quantity: 100,
          price: 150.50,
          fees: 1.00,
          commission: 0.00,
          status: 'filled',
          executedAt: '2025-01-28T10:00:00Z',
          meta: { rowIndex: 1, raw: {}, source: 'webull-csv' }
        }
      ],
      summary: {
        totalRows: 2,
        headerRows: 1,
        parsedRows: 1,
        filledRows: 1,
        importedRows: 0, // No imports due to failure
        skipped: {
          cancelled: 0,
          zeroQty: 0,
          zeroPrice: 0,
          badDate: 0,
          parseError: 0
        },
        errors: [],
        errorSummary: {}
      },
      skippedRows: []
    });

    // Mock failed transaction
    vi.mocked(executeImportTransaction).mockResolvedValue({
      success: false,
      error: 'Database connection failed',
      rollbackRequired: true
    });

    // Mock error response
    const mockErrorResponse = {
      success: false,
      error: 'Import failed due to a database error',
      message: 'The import was rolled back to prevent partial data. Please try again.',
      details: 'Database connection failed',
      profiling: {
        totalRows: 2,
        headerRows: 1,
        parsedRows: 1,
        filledRows: 1,
        importedRows: 0, // No imports due to rollback
        skipped: {
          cancelled: 0,
          zeroQty: 0,
          zeroPrice: 0,
          badDate: 0,
          parseError: 0
        }
      },
      errors: [],
      errorSummary: {},
      skippedRows: []
    };

    vi.mocked(createTransactionErrorResponse).mockReturnValue(mockErrorResponse);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Import failed due to a database error');
    expect(data.message).toBe('The import was rolled back to prevent partial data. Please try again.');
    expect(data.profiling.importedRows).toBe(0);
  });

  it('should handle authentication failure', async () => {
    // Mock authentication failure
    mockSupabase.auth.getUser.mockReturnValue({
      data: { user: null },
      error: { message: 'Authentication failed' }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication failed');
  });

  it('should handle missing file', async () => {
    // Mock request without file
    const emptyFormData = new FormData();
    const emptyRequest = new NextRequest('http://localhost:3000/api/import/csv-webull-final', {
      method: 'POST',
      body: emptyFormData
    });

    const response = await POST(emptyRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No file provided');
  });

  it('should handle unexpected errors', async () => {
    // Mock unexpected error
    const { processWebullCsv } = await import('../webull');
    vi.mocked(processWebullCsv).mockImplementation(() => {
      throw new Error('Unexpected parsing error');
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Import failed');
    expect(data.details).toBe('Unexpected parsing error');
  });
});
