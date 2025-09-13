# Prompt 1 — DB Hard Guarantees: Implementation Summary

## 🎯 **Objective**
Implement database-level guarantees for unique deduplication, automatic hash computation, and cleanup operations to ensure data integrity and prevent duplicates.

## 📁 **Files Created/Modified**

### **New Migration File**
- `supabase/migrations/20250101000006_add_unique_dedupe_and_triggers.sql`

### **Updated API Routes**
- `app/api/import/csv/commit/route.ts` - Updated to use `unique_hash` instead of `dedupe_hash`
- `app/api/import/manual/route.ts` - Updated to use `unique_hash` instead of `dedupe_hash`

### **Test Script**
- `scripts/test-db-guarantees.js` - Comprehensive test suite for all database guarantees

## 🔧 **Database Features Implemented**

### **1. Unique Hash Computation**
```sql
CREATE OR REPLACE FUNCTION compute_unique_hash(ex record) 
RETURNS text AS $$
BEGIN
  RETURN encode(
    digest(
      COALESCE(ex.timestamp::text, '') || '|' ||
      COALESCE(ex.symbol::text, '') || '|' ||
      COALESCE(ex.side::text, '') || '|' ||
      COALESCE(ABS(ex.quantity)::text, '') || '|' ||
      COALESCE(ex.price::text, '') || '|' ||
      COALESCE(ex.broker_account_id::text, ''),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Purpose**: Computes SHA256 hash for execution deduplication based on:
- timestamp
- symbol
- side
- absolute quantity
- price
- broker_account_id

### **2. Database Schema Updates**
```sql
-- Add unique_hash column
ALTER TABLE executions_normalized 
ADD COLUMN IF NOT EXISTS unique_hash text;

-- Create performance index
CREATE INDEX IF NOT EXISTS idx_executions_unique_hash 
ON executions_normalized (unique_hash);

-- Create unique constraint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS ux_exec_dedupe
ON executions_normalized (
  user_id,
  COALESCE(broker_account_id, '00000000-0000-0000-0000-000000000000'::uuid),
  unique_hash
);
```

### **3. Automatic Trigger**
```sql
-- Trigger function
CREATE OR REPLACE FUNCTION before_insert_exec_norm()
RETURNS trigger AS $$
BEGIN
  IF NEW.unique_hash IS NULL OR NEW.unique_hash = '' THEN
    NEW.unique_hash := compute_unique_hash(NEW);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_before_insert_exec_norm
  BEFORE INSERT ON executions_normalized
  FOR EACH ROW
  EXECUTE FUNCTION before_insert_exec_norm();
```

**Purpose**: Automatically computes `unique_hash` for new executions if not provided.

### **4. Cleanup Functions**

#### **Mark Stuck Runs**
```sql
CREATE OR REPLACE FUNCTION mark_stuck_import_runs()
RETURNS integer AS $$
DECLARE
  stuck_count integer;
BEGIN
  UPDATE import_runs 
  SET 
    status = 'failed',
    finished_at = now(),
    summary = jsonb_set(
      COALESCE(summary, '{}'::jsonb),
      '{error}',
      '"timeout"'
    )
  WHERE 
    status = 'processing' 
    AND started_at < now() - interval '24 hours';
  
  GET DIAGNOSTICS stuck_count = ROW_COUNT;
  RETURN stuck_count;
END;
$$ LANGUAGE plpgsql;
```

#### **Cleanup Temp Uploads**
```sql
CREATE OR REPLACE FUNCTION cleanup_temp_uploads()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM temp_uploads 
  WHERE created_at < now() - interval '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

#### **Cleanup Old Raw Items**
```sql
CREATE OR REPLACE FUNCTION cleanup_old_raw_items()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM raw_import_items 
  WHERE 
    created_at < now() - interval '30 days'
    AND import_run_id IN (
      SELECT id FROM import_runs 
      WHERE status IN ('failed', 'partial') 
      AND finished_at < now() - interval '30 days'
    );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

### **5. Comprehensive Maintenance Function**
```sql
CREATE OR REPLACE FUNCTION run_cleanup_maintenance()
RETURNS json AS $$
DECLARE
  stuck_runs integer;
  temp_uploads integer;
  raw_items integer;
  result json;
BEGIN
  stuck_runs := mark_stuck_import_runs();
  temp_uploads := cleanup_temp_uploads();
  raw_items := cleanup_old_raw_items();
  
  result := json_build_object(
    'stuck_runs_marked', stuck_runs,
    'temp_uploads_deleted', temp_uploads,
    'raw_items_deleted', raw_items,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### **6. Monitoring Views**

#### **Stuck Import Runs**
```sql
CREATE OR REPLACE VIEW stuck_import_runs AS
SELECT 
  id,
  user_id,
  source,
  status,
  started_at,
  EXTRACT(EPOCH FROM (now() - started_at))/3600 as hours_stuck
FROM import_runs 
WHERE 
  status = 'processing' 
  AND started_at < now() - interval '24 hours'
ORDER BY started_at ASC;
```

#### **Old Temp Uploads**
```sql
CREATE OR REPLACE VIEW old_temp_uploads AS
SELECT 
  id,
  user_id,
  filename,
  created_at,
  EXTRACT(EPOCH FROM (now() - created_at))/3600 as hours_old
FROM temp_uploads 
WHERE created_at < now() - interval '24 hours'
ORDER BY created_at ASC;
```

## 🧪 **Testing & Verification**

### **Test Coverage**
- ✅ Unique hash computation for different execution types
- ✅ Trigger functionality (automatic vs manual hash)
- ✅ Unique index deduplication scenarios
- ✅ Cleanup functions behavior
- ✅ Monitoring views structure
- ✅ Acceptance criteria validation

### **Test Scenarios**
1. **Hash Computation**: Equity, option, and futures executions
2. **Trigger Behavior**: Null vs pre-computed hash handling
3. **Deduplication**: Same user, different users, different broker accounts
4. **Cleanup Operations**: Stuck runs, temp uploads, old raw items
5. **Monitoring**: Views for stuck runs and old uploads

## 🎯 **Acceptance Criteria Met**

### **✅ Re-running the same file can't create dupes (DB rejects)**
- **Implementation**: Unique index `ux_exec_dedupe` on `(user_id, broker_account_id, unique_hash)`
- **Behavior**: Second insert of identical execution fails with unique constraint violation

### **✅ Inserts without unique_hash get it via trigger**
- **Implementation**: `trigger_before_insert_exec_norm` trigger
- **Behavior**: Automatically computes SHA256 hash if `unique_hash` is null or empty

### **✅ SQL script exists to unstick old runs and purge temp uploads**
- **Implementation**: `run_cleanup_maintenance()` function
- **Behavior**: Marks stuck runs as failed and deletes old temp uploads
- **TTL**: 24 hours for temp uploads, 24 hours for stuck runs, 30 days for old raw items

## 🔒 **Security & Permissions**

### **Function Permissions**
```sql
GRANT EXECUTE ON FUNCTION compute_unique_hash(record) TO authenticated;
GRANT EXECUTE ON FUNCTION before_insert_exec_norm() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_stuck_import_runs() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_temp_uploads() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_raw_items() TO authenticated;
GRANT EXECUTE ON FUNCTION run_cleanup_maintenance() TO authenticated;
```

### **View Permissions**
```sql
GRANT SELECT ON stuck_import_runs TO authenticated;
GRANT SELECT ON old_temp_uploads TO authenticated;
```

## 📊 **Performance Considerations**

### **Indexes Created**
- `idx_executions_unique_hash` - Performance index on `unique_hash`
- `ux_exec_dedupe` - Unique constraint for deduplication

### **Hash Algorithm**
- **Algorithm**: SHA256 (via pgcrypto extension)
- **Input**: Concatenated string of execution fields
- **Output**: 64-character hexadecimal string
- **Performance**: Immutable function for optimal performance

## 🚀 **Usage Examples**

### **Manual Cleanup**
```sql
-- Run all cleanup operations
SELECT run_cleanup_maintenance();

-- Check stuck runs
SELECT * FROM stuck_import_runs;

-- Check old temp uploads
SELECT * FROM old_temp_uploads;
```

### **API Integration**
The existing API routes have been updated to use the new `unique_hash` column:
- CSV import automatically benefits from database-level deduplication
- Manual entry uses the same deduplication mechanism
- All inserts are protected by the unique constraint

## 📈 **Benefits Achieved**

1. **Data Integrity**: Hard deduplication at database layer prevents duplicates
2. **Automation**: Triggers handle hash computation automatically
3. **Maintenance**: Automated cleanup prevents data accumulation
4. **Monitoring**: Views provide visibility into system health
5. **Performance**: Proper indexing ensures fast lookups
6. **Reliability**: Database constraints provide fail-safe protection

## 🔄 **Migration Impact**

### **Backward Compatibility**
- Existing `dedupe_hash` column remains (for data migration)
- New `unique_hash` column added alongside
- API routes updated to use new column
- No breaking changes to existing functionality

### **Data Migration**
- New executions use `unique_hash` automatically
- Existing data can be migrated by running hash computation
- Unique constraint prevents future duplicates

## ✅ **Implementation Status**

**COMPLETED** - All requirements implemented and tested:

- ✅ Unique hash computation function
- ✅ Database trigger for automatic hash computation
- ✅ Unique index for deduplication
- ✅ Cleanup functions for stuck runs and temp uploads
- ✅ Monitoring views
- ✅ Comprehensive maintenance function
- ✅ Proper permissions and documentation
- ✅ API integration updates
- ✅ Test coverage and validation
- ✅ Build verification

The database now provides hard guarantees for data integrity, automatic deduplication, and system maintenance.
