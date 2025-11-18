# Trade-Journal Debug & Test Routes

This document lists all debug and test API routes in the Trade-Journal application and explains how to enable them.

## Overview

Debug and test routes are **disabled by default in production** for security reasons. They can be accessed in:

- **Development environment** (`NODE_ENV !== 'production'`)
- **Production with explicit flag** (`ENABLE_DEBUG_ROUTES=true` environment variable)

## Security

All debug and test routes are protected by the `debugRouteGuard()` utility from `@/lib/route-guards`. This guard returns a 404 response when debug routes are not allowed, making them invisible in production unless explicitly enabled.

## Enabling Debug Routes

### In Development

Debug routes are automatically enabled when running in development mode:

```bash
npm run dev
# or
pnpm dev
```

### In Production

To enable debug routes in production, set the environment variable:

```bash
ENABLE_DEBUG_ROUTES=true
```

**⚠️ WARNING:** Only enable debug routes in production for troubleshooting purposes. They should be disabled immediately after use to prevent security vulnerabilities.

## Debug Routes

### `/api/debug-trades`

- **Purpose**: Debug endpoint for inspecting user trades
- **Method**: GET
- **Auth**: Required
- **Returns**: User ID, trade count, and list of trades with basic fields

### `/api/debug-calendar`

- **Purpose**: Debug calendar metrics and position calculations
- **Method**: GET
- **Auth**: Required
- **Returns**: User trades grouped by day, positions, and calendar data

### `/api/debug-csv-parsing`

- **Purpose**: Debug CSV file parsing without persisting to database
- **Method**: POST
- **Auth**: Required
- **Input**: FormData with CSV file
- **Returns**: Parsed rows, detection results, and parsing errors

### `/api/debug-import`

- **Purpose**: Comprehensive debug for import system
- **Method**: POST
- **Auth**: Required
- **Input**: FormData with CSV file
- **Returns**: Environment check, auth status, file parsing, table writes, and full pipeline diagnostics

## Test Routes

### `/api/test-supabase`

- **Purpose**: Test Supabase connection and authentication
- **Method**: GET
- **Returns**: Connection status, environment variable status

### `/api/test-supabase-connection`

- **Purpose**: Extended Supabase connection test
- **Method**: GET
- **Returns**: Detailed connection diagnostics

### `/api/test-env`

- **Purpose**: Check environment variables
- **Method**: GET
- **Returns**: Status of all required environment variables

### `/api/test-db`

- **Purpose**: Database performance and query tests
- **Method**: GET
- **Auth**: Required
- **Returns**: Connection time, query performance, user data access

### `/api/test-dashboard`

- **Purpose**: Test dashboard data fetching
- **Method**: GET
- **Auth**: Required
- **Returns**: User profile, recent trades, broker connections

### `/api/test-user`

- **Purpose**: Test user authentication and profile
- **Method**: GET
- **Auth**: Required
- **Returns**: User session data

### `/api/test-features`

- **Purpose**: Test feature flags and access
- **Method**: GET
- **Auth**: Required
- **Returns**: Feature availability status

### `/api/test-import`

- **Purpose**: Test import system functionality
- **Method**: POST
- **Auth**: Required
- **Returns**: Import system diagnostics

### `/api/test-simple`

- **Purpose**: Simple health check
- **Method**: GET
- **Returns**: Basic server status

### `/api/test-basic-insert`

- **Purpose**: Test basic database insertion
- **Method**: POST
- **Auth**: Required
- **Returns**: Insert operation result

### `/api/test-trade-insert`

- **Purpose**: Test trade insertion with full validation
- **Method**: POST
- **Auth**: Required
- **Returns**: Trade insert result with validation

### `/api/test-trade-fields`

- **Purpose**: Test trade field validation
- **Method**: GET
- **Returns**: Expected trade fields and schema

### `/api/test-minimal-trade`

- **Purpose**: Test minimal trade creation
- **Method**: POST
- **Auth**: Required
- **Returns**: Minimal trade insert result

### `/api/test-webull-connection`

- **Purpose**: Test Webull broker connection
- **Method**: GET
- **Returns**: Webull API connection status

### `/api/test-webull-import-simple`

- **Purpose**: Test simplified Webull CSV import
- **Method**: POST
- **Auth**: Required
- **Returns**: Webull import results

## Check Routes (Schema Validation)

### `/api/check-trades-schema`

- **Purpose**: Validate trades table schema
- **Method**: GET
- **Auth**: Required
- **Returns**: Existing trades sample and schema validation

### `/api/check-import-runs-table`

- **Purpose**: Validate import_runs table schema
- **Method**: GET
- **Auth**: Required
- **Returns**: Import runs schema and existing data

## Implementation Pattern

All debug/test routes follow this pattern:

```typescript
import { debugRouteGuard } from '@/lib/route-guards';

export async function GET(request: NextRequest) {
  // Guard: Only allow in development or when explicitly enabled
  const guardResponse = debugRouteGuard();
  if (guardResponse) return guardResponse;
  
  // ... actual route logic
}
```

## Best Practices

1. **Never use debug routes in production** unless actively troubleshooting
2. **Always disable debug routes** after troubleshooting is complete
3. **Never log sensitive data** in debug routes (passwords, tokens, etc.)
4. **Rate limit debug routes** if exposing them in production
5. **Monitor access** to debug routes in production environments
6. **Document findings** from debug sessions for future reference

## Adding New Debug Routes

When creating new debug/test routes:

1. Name them with `debug-` or `test-` prefix
2. Import and apply `debugRouteGuard()` at the start of the handler
3. Document the route in this file
4. Add appropriate logging for diagnostics
5. Return structured JSON responses for easy parsing

## Removing Debug Routes

To permanently remove debug routes:

1. Delete the route files from `app/api/debug-*` and `app/api/test-*`
2. Update this documentation
3. Search for any frontend code that calls these routes
4. Test that the application works without them

