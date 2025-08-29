# Prompt 8 — Admin: Instrument Merge + Re-point Tool

## Overview
Implemented an admin tool for merging instruments and fixing mistaken splits/aliases without data loss. This provides a safe, transactional way to consolidate duplicate or incorrectly split instruments.

## Features Implemented

### 1. Admin Page (`/admin/instruments/merge`)
- **Route**: `app/admin/instruments/merge/page.tsx`
- **Access Control**: Admin role required
- **Purpose**: Entry point for the instrument merge tool

### 2. Instrument Merge Tool UI
- **Component**: `components/admin/InstrumentMergeTool.tsx`
- **Features**:
  - Search for source and target instruments
  - Display execution and alias counts
  - Merge preview with operation details
  - Warning about irreversible operation
  - Loading states and error handling
  - Success feedback with trade rebuild prompt

### 3. Search API
- **Route**: `app/api/admin/instruments/search/route.ts`
- **Method**: GET
- **Features**:
  - Search by symbol or alias
  - Returns execution and alias counts
  - Combines direct matches and alias matches
  - Sorts results (exact matches first)
  - Protected by admin role check
  - Wrapped with telemetry for observability

### 4. Merge API
- **Route**: `app/api/admin/instruments/merge/route.ts`
- **Method**: POST
- **Features**:
  - Admin role validation
  - Input validation (source/target IDs)
  - Instrument existence verification
  - Transactional merge operation
  - Trade rebuilding for affected symbols
  - Comprehensive logging
  - Error handling and rollback

### 5. Database Function
- **Migration**: `supabase/migrations/20250101000010_add_merge_instruments_function.sql`
- **Function**: `merge_instruments(p_source_id, p_target_id, p_admin_user_id)`
- **Operations**:
  - Update `executions_normalized.instrument_id` from source to target
  - Move `instrument_aliases` with deduplication
  - Delete source instrument
  - Log operation in `admin_audit_log`
  - Return operation counts

### 6. Audit Logging
- **Table**: `admin_audit_log`
- **Fields**: admin_user_id, action, table_name, record_id, details, created_at
- **RLS Policies**: Admin users can view, system can insert
- **Indexes**: Performance optimization for queries

## Technical Implementation

### Security
- **Admin Role Check**: All operations require admin role
- **Input Validation**: Comprehensive validation of source/target IDs
- **Transaction Safety**: Database-level transaction with rollback on error
- **Audit Trail**: Complete logging of all merge operations

### Data Integrity
- **Referential Integrity**: Maintains foreign key relationships
- **Deduplication**: Handles duplicate aliases during merge
- **Cascade Updates**: Updates all related records atomically
- **Trade Rebuilding**: Automatically rebuilds affected trades

### User Experience
- **Search Interface**: Real-time search with debounced queries
- **Visual Feedback**: Clear indication of what will be merged
- **Progress Indication**: Loading states during operations
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Toast notifications with operation summary

## API Endpoints

### GET `/api/admin/instruments/search?q=<query>`
```typescript
// Response
{
  id: string;
  symbol: string;
  instrument_type: 'equity' | 'option' | 'future';
  exchange?: string;
  currency?: string;
  multiplier?: number;
  expiry?: string;
  strike?: number;
  option_type?: 'call' | 'put';
  underlying?: string;
  execution_count: number;
  alias_count: number;
  matched_via?: string;
}[]
```

### POST `/api/admin/instruments/merge`
```typescript
// Request
{
  sourceId: string;
  targetId: string;
}

// Response
{
  executionsUpdated: number;
  aliasesMoved: number;
  sourceDeleted: boolean;
  affectedSymbols: string[];
  tradeRebuild: {
    updatedTrades: number;
    createdTrades: number;
  };
}
```

## Database Schema

### `admin_audit_log` Table
```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `merge_instruments` Function
```sql
CREATE OR REPLACE FUNCTION merge_instruments(
  p_source_id UUID,
  p_target_id UUID,
  p_admin_user_id UUID
) RETURNS TABLE(
  executions_updated BIGINT,
  aliases_moved BIGINT,
  source_deleted BOOLEAN
)
```

## Testing

### Test Script
- **File**: `scripts/test-instrument-merge.js`
- **Coverage**:
  - Search API functionality
  - Merge validation logic
  - Transaction behavior
  - Trade rebuilding
  - Audit logging
  - Error handling
  - UI components
  - Acceptance criteria

### Acceptance Criteria Verification
1. ✅ Merging two test instruments re-points executions
2. ✅ Aliases are cleaned and moved to target
3. ✅ Source instrument is deleted
4. ✅ Trades rebuild successfully for affected symbols

## Usage Flow

1. **Access**: Navigate to `/admin/instruments/merge` (admin role required)
2. **Search**: Use search inputs to find source and target instruments
3. **Select**: Choose instruments from search results
4. **Preview**: Review merge operation details
5. **Confirm**: Click "Merge Instruments" to execute
6. **Monitor**: Watch progress and handle any errors
7. **Rebuild**: Optionally rebuild trades for affected symbols

## Error Handling

### Common Scenarios
- **Non-admin Access**: Returns 403 with "Admin access required"
- **Invalid IDs**: Returns 400 with validation error
- **Missing Instruments**: Returns 404 with specific error
- **Transaction Failure**: Returns 500 with rollback
- **Trade Rebuild Failure**: Logs error but doesn't fail merge

### Logging
- **Operation Start**: Logs merge attempt with details
- **Operation Success**: Logs completion with results
- **Operation Failure**: Logs error with context
- **Audit Trail**: Complete record in `admin_audit_log`

## Production Considerations

### Performance
- **Indexes**: Optimized queries with proper indexing
- **Batch Operations**: Efficient bulk updates
- **Transaction Size**: Reasonable limits on operation scope

### Monitoring
- **Telemetry**: All API routes wrapped with observability
- **Audit Logs**: Complete trail of admin operations
- **Error Tracking**: Comprehensive error logging

### Safety
- **Admin Only**: Strict role-based access control
- **Validation**: Multiple layers of input validation
- **Rollback**: Automatic transaction rollback on errors
- **Backup**: Consider database backups before major operations

## Future Enhancements

### Potential Improvements
1. **Bulk Operations**: Merge multiple instruments at once
2. **Dry Run Mode**: Preview changes without executing
3. **Undo Functionality**: Ability to reverse merges
4. **Advanced Search**: More sophisticated instrument search
5. **Conflict Resolution**: Better handling of complex merge scenarios
6. **Notification System**: Alert users about instrument changes

### Integration Points
1. **Import Pipeline**: Auto-detect potential merges during import
2. **Data Validation**: Periodic checks for duplicate instruments
3. **Reporting**: Admin dashboard with merge statistics
4. **API Integration**: External tools for instrument management

## Conclusion

The Instrument Merge Tool provides a robust, safe, and user-friendly way to consolidate duplicate instruments while maintaining data integrity and providing a complete audit trail. The implementation follows best practices for security, performance, and user experience, making it suitable for production use.
