/**
 * Standardized error codes for import pipeline
 * Provides consistent, actionable error messages while keeping internal details in server logs
 */

export type ImportErrorCode = 
  | 'PARSE_ERROR'      // General parsing failure
  | 'BAD_DATE'         // Invalid date format or impossible date
  | 'BAD_PRICE'         // Invalid price format or negative price
  | 'ZERO_QTY'          // Zero or negative quantity
  | 'CANCELLED'         // Order status is cancelled
  | 'DUPLICATE'         // Trade already exists (idempotency)
  | 'MISSING_REQUIRED'; // Required field is missing or empty

export interface ImportError {
  rowIndex: number;
  code: ImportErrorCode;
  message: string;
  symbolRaw: string;
  details?: any; // Internal details for server logging
}

export interface ImportErrorResponse {
  errors: ImportError[];
  totalErrors: number;
  errorSummary: Record<ImportErrorCode, number>;
}

/**
 * Create a standardized import error
 */
export function createImportError(
  rowIndex: number,
  code: ImportErrorCode,
  symbolRaw: string,
  details?: any
): ImportError {
  const message = getErrorMessage(code, details);
  return {
    rowIndex,
    code,
    message,
    symbolRaw,
    details
  };
}

/**
 * Get user-friendly error message for error code
 */
export function getErrorMessage(code: ImportErrorCode, details?: any): string {
  switch (code) {
    case 'PARSE_ERROR':
      return 'Unable to parse trade data. Please check the row format.';
    case 'BAD_DATE':
      return 'Invalid date format. Please ensure dates are in MM/DD/YYYY or YYYY-MM-DD format.';
    case 'BAD_PRICE':
      return 'Invalid price format. Please ensure prices are positive numbers.';
    case 'ZERO_QTY':
      return 'Zero quantity detected. Only filled trades with positive quantities are imported.';
    case 'CANCELLED':
      return 'Order was cancelled. Only filled trades are imported.';
    case 'DUPLICATE':
      return 'This trade already exists in your account. Duplicates are automatically skipped.';
    case 'MISSING_REQUIRED':
      return 'Required field is missing. Please check that all necessary columns are present.';
    default:
      return 'Unknown error occurred during import.';
  }
}

/**
 * Create error summary from array of errors
 */
export function createErrorSummary(errors: ImportError[]): Record<ImportErrorCode, number> {
  const summary: Record<ImportErrorCode, number> = {
    PARSE_ERROR: 0,
    BAD_DATE: 0,
    BAD_PRICE: 0,
    ZERO_QTY: 0,
    CANCELLED: 0,
    DUPLICATE: 0,
    MISSING_REQUIRED: 0
  };

  errors.forEach(error => {
    summary[error.code]++;
  });

  return summary;
}

/**
 * Log error details to server console with stack trace
 */
export function logImportError(error: ImportError, context?: string): void {
  const prefix = context ? `[${context}]` : '[IMPORT_ERROR]';
  console.error(`${prefix} Row ${error.rowIndex} (${error.symbolRaw}):`, {
    code: error.code,
    message: error.message,
    details: error.details,
    stack: new Error().stack
  });
}

/**
 * Create error response for API endpoints
 */
export function createErrorResponse(errors: ImportError[]): ImportErrorResponse {
  return {
    errors,
    totalErrors: errors.length,
    errorSummary: createErrorSummary(errors)
  };
}

