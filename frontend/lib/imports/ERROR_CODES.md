# Standardized Error Codes for Import Pipeline

This document describes the standardized error handling system implemented across the Webull import pipeline.

## Error Codes

The system uses 7 standardized error codes that provide actionable feedback to users:

| Code | Description | User Message |
|------|-------------|--------------|
| `PARSE_ERROR` | General parsing failure | "Unable to parse trade data. Please check the row format." |
| `BAD_DATE` | Invalid date format or impossible date | "Invalid date format. Please ensure dates are in MM/DD/YYYY or YYYY-MM-DD format." |
| `BAD_PRICE` | Invalid price format or negative price | "Invalid price format. Please ensure prices are positive numbers." |
| `ZERO_QTY` | Zero or negative quantity | "Zero quantity detected. Only filled trades with positive quantities are imported." |
| `CANCELLED` | Order status is cancelled | "Order was cancelled. Only filled trades are imported." |
| `DUPLICATE` | Trade already exists (idempotency) | "This trade already exists in your account. Duplicates are automatically skipped." |
| `MISSING_REQUIRED` | Required field is missing or empty | "Required field is missing. Please check that all necessary columns are present." |

## Error Structure

Each error includes:

```typescript
interface ImportError {
  rowIndex: number;        // Row number in CSV (1-based)
  code: ImportErrorCode;   // Standardized error code
  message: string;         // User-friendly message
  symbolRaw: string;       // Original symbol from CSV
  details?: any;          // Internal details for server logging
}
```

## API Response Format

API endpoints return standardized error arrays:

```typescript
interface ImportErrorResponse {
  errors: ImportError[];                    // Array of all errors
  totalErrors: number;                      // Total error count
  errorSummary: Record<ImportErrorCode, number>; // Count by error type
}
```

## Server Logging

Server logs include detailed stack traces and internal context:

```
[parseWebullCsvRow] Row 3 (TSLA): {
  code: 'ZERO_QTY',
  message: 'Zero quantity detected. Only filled trades with positive quantities are imported.',
  details: {
    quantity: -5,
    row: { Symbol: 'TSLA', Filled: '-5', ... }
  },
  stack: 'Error: \n    at logImportError...'
}
```

## Client vs Server Information

### Client Sees:
- User-friendly error messages
- Row numbers and symbols
- Actionable guidance

### Server Logs:
- Full stack traces
- Internal data structures
- Database query details
- Raw CSV values

## Usage Examples

### Creating an Error
```typescript
const error = createImportError(5, 'BAD_DATE', 'AAPL', {
  field: 'executedTime',
  value: 'invalid-date',
  row: { /* full row data */ }
});
```

### Logging an Error
```typescript
logImportError(error, 'parseWebullCsvRow');
```

### Creating Error Summary
```typescript
const summary = createErrorSummary(errors);
// Returns: { PARSE_ERROR: 2, BAD_DATE: 1, ZERO_QTY: 3, ... }
```

## Integration Points

### Webull Parser (`lib/imports/webull.ts`)
- Uses standardized error codes in `parseWebullCsvRow`
- Collects errors in `processWebullCsv`
- Maps filter reasons to error codes

### Datetime Utility (`lib/datetime.ts`)
- Uses `BAD_DATE` for invalid timestamps
- Logs detailed context for debugging

### Upsert Utility (`lib/imports/upsertTrades.ts`)
- Uses `DUPLICATE` for existing trades
- Uses `PARSE_ERROR` for database failures

### API Endpoints
- Return `errors[]` array in responses
- Include `errorSummary` for statistics
- Hide internal details from client

## Benefits

1. **Consistency**: All errors use the same structure and codes
2. **Actionability**: Users get clear guidance on how to fix issues
3. **Debugging**: Server logs contain full context for developers
4. **Analytics**: Error summaries help identify common issues
5. **User Experience**: Friendly messages without technical jargon

## Testing

Comprehensive test coverage includes:
- Error creation and message generation
- Error summary calculations
- Integration with parsing pipeline
- Client vs server information separation

Run tests with:
```bash
npm test -- lib/imports/__tests__/errors.test.ts
npm test -- lib/imports/__tests__/error-integration.test.ts
```

