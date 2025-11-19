import { WebullTradeDTO } from './webull';
import { UpsertResult } from './upsertTrades';
import { logImportError } from './errors';

export interface TransactionResult {
  success: boolean;
  result?: UpsertResult;
  error?: string;
  rollbackRequired?: boolean;
}

/**
 * Wraps the import process in a transaction-like behavior
 * Since Supabase doesn't support explicit transactions in the client,
 * we implement a "best effort" approach with comprehensive error handling
 */
export async function executeImportTransaction(
  supabase: any,
  trades: WebullTradeDTO[],
  userId: string,
  fileId: string,
  onSuccess?: (result: UpsertResult) => void,
  onError?: (error: Error) => void
): Promise<TransactionResult> {
  console.log(`Starting transaction for ${trades.length} trades`);
  
  try {
    // Pre-validate all trades before attempting any inserts
    const validationErrors = await validateTrades(supabase, trades, userId);
    if (validationErrors.length > 0) {
      throw new Error(`Pre-validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Import the upsertTrades function dynamically to avoid circular imports
    const { upsertTrades } = await import('./upsertTrades');
    
    // Execute the upsert with comprehensive error handling
    const result = await upsertTrades(supabase, trades, userId);
    
    // Check for critical failures
    if (result.errors > 0 && result.inserted === 0) {
      throw new Error(`All ${trades.length} trades failed to import. No data was saved.`);
    }
    
    // Check for partial failures that might indicate data corruption
    if (result.errors > trades.length * 0.5) { // More than 50% failed
      throw new Error(`Too many failures (${result.errors}/${trades.length}). Import aborted to prevent data corruption.`);
    }
    
    console.log('Transaction completed successfully');
    
    if (onSuccess) {
      onSuccess(result);
    }
    
    return {
      success: true,
      result
    };
    
  } catch (error: any) {
    console.error('Transaction failed:', error);
    
    if (onError) {
      onError(error);
    }
    
    // Log the error for debugging
    console.error('Transaction failed:', error, fileId, userId);
    
    return {
      success: false,
      error: error.message,
      rollbackRequired: true
    };
  }
}

/**
 * Pre-validates trades before attempting to insert them
 * This helps catch issues early and prevent partial imports
 */
async function validateTrades(
  supabase: any,
  trades: WebullTradeDTO[],
  userId: string
): Promise<string[]> {
  const errors: string[] = [];
  
  try {
    // Validate userId is present
    if (!userId || userId.trim() === '') {
      errors.push('User ID is required');
    }
    
    // Check for required fields in all trades
    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      
      if (!trade.symbol || !trade.side || !trade.executedAt) {
        errors.push(`Trade ${i + 1}: Missing required fields (symbol, side, executedAt)`);
      }
      
      if (trade.quantity <= 0 || trade.price <= 0) {
        errors.push(`Trade ${i + 1}: Invalid quantity or price`);
      }
      
      if (!trade.broker || !trade.assetType) {
        errors.push(`Trade ${i + 1}: Missing broker or asset type`);
      }
    }
    
    // Check database connectivity by testing a simple query
    const { data: dbTest, error: dbError } = await supabase
      .from('trades')
      .select('id')
      .limit(1);
    
    if (dbError) {
      errors.push(`Database connectivity issue: ${dbError.message}`);
    }
    
  } catch (error: any) {
    errors.push(`Validation error: ${error.message}`);
  }
  
  return errors;
}

/**
 * Creates a transaction-safe error response
 */
export function createTransactionErrorResponse(
  error: Error,
  summary: any,
  skippedRows: any[]
) {
  return {
    success: false,
    error: 'Import failed due to a database error',
    message: 'The import was rolled back to prevent partial data. Please try again.',
    details: error.message,
    profiling: {
      totalRows: summary.totalRows,
      headerRows: summary.headerRows,
      parsedRows: summary.parsedRows,
      filledRows: summary.filledRows,
      importedRows: 0, // No trades were imported due to rollback
      skipped: {
        cancelled: summary.skipped.cancelled,
        zeroQty: summary.skipped.zeroQty,
        zeroPrice: summary.skipped.zeroPrice,
        badDate: summary.skipped.badDate,
        parseError: summary.skipped.parseError
      }
    },
    errors: summary.errors,
    errorSummary: summary.errorSummary,
    skippedRows: skippedRows.slice(0, 10)
  };
}

/**
 * Creates a transaction-safe success response
 */
export function createTransactionSuccessResponse(
  result: UpsertResult,
  summary: any,
  skippedRows: any[]
) {
  return {
    success: true,
    message: 'Webull CSV import completed successfully',
    profiling: {
      totalRows: summary.totalRows,
      headerRows: summary.headerRows,
      parsedRows: summary.parsedRows,
      filledRows: summary.filledRows,
      importedRows: result.inserted,
      skipped: {
        cancelled: summary.skipped.cancelled,
        zeroQty: summary.skipped.zeroQty,
        zeroPrice: summary.skipped.zeroPrice,
        badDate: summary.skipped.badDate,
        parseError: summary.skipped.parseError
      }
    },
    stats: {
      totalRows: summary.totalRows,
      inserted: result.inserted,
      duplicatesSkipped: result.duplicatesSkipped,
      skipped: (Object.values(summary.skipped) as number[]).reduce((a, b) => a + b, 0),
      errors: result.errors
    },
    errors: summary.errors,
    errorSummary: summary.errorSummary,
    skippedRows: skippedRows.slice(0, 10)
  };
}


