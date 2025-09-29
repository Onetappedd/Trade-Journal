# Idempotency Migration

This migration adds idempotency support to the trades table to prevent duplicate imports.

## What This Migration Does

### 1. Adds New Columns
- `idempotency_key` (text) - Unique key per user for deduplication
- `symbol_raw` (text) - Original symbol as provided by broker
- `meta` (jsonb) - Additional metadata from broker
- `broker` (text) - Broker name (e.g., webull, td_ameritrade)
- `external_id` (text) - External ID from broker (e.g., order ID)
- `asset_type` (text) - Type of asset (equity, option, futures)
- `fees` (numeric) - Fees charged by broker
- `commission` (numeric) - Commission charged by broker
- `executed_at` (timestamptz) - Precise execution timestamp from broker

### 2. Creates Indexes
- `trades_user_idempotency_uidx` - Unique index on (user_id, idempotency_key)
- `trades_symbol_raw_idx` - Index on symbol_raw for lookups
- `trades_broker_idx` - Index on broker for filtering
- `trades_external_id_idx` - Index on external_id for broker-specific lookups
- `trades_executed_at_idx` - Index on executed_at for time-based queries
- `trades_user_executed_at_idx` - Composite index for user + executed_at
- `trades_user_broker_idx` - Composite index for user + broker

### 3. Creates Functions
- `generate_idempotency_key()` - Generates unique keys for deduplication
- `set_trade_idempotency_key()` - Trigger function to auto-generate keys

### 4. Creates Triggers
- `trigger_set_trade_idempotency_key` - Automatically sets idempotency_key on insert/update

### 5. Creates View
- `trades_with_meta` - Enhanced view with parsed metadata fields

## How Idempotency Works

### Key Generation Strategy
1. **Primary**: If `external_id` exists, use `hash(broker + external_id)`
2. **Fallback**: If no `external_id`, use `hash(broker + symbol_raw + executed_at + side + price + quantity)`

### Deduplication Rules
- Same `user_id` + `idempotency_key` = Duplicate (prevented by unique constraint)
- Different users can have same `external_id` (different `user_id`)
- Same user with different `external_id` = Different trades

### Example Scenarios

#### Scenario 1: Webull Import with Order ID
```sql
-- First import
INSERT INTO trades (user_id, broker, external_id, symbol, ...) 
VALUES ('user1', 'webull', 'order123', 'AAPL', ...);
-- idempotency_key = hash('webull|order123')

-- Second import (same order ID)
INSERT INTO trades (user_id, broker, external_id, symbol, ...) 
VALUES ('user1', 'webull', 'order123', 'AAPL', ...);
-- ❌ FAILS: Duplicate idempotency_key
```

#### Scenario 2: Webull Import without Order ID
```sql
-- First import
INSERT INTO trades (user_id, broker, symbol_raw, executed_at, side, entry_price, quantity, ...) 
VALUES ('user1', 'webull', 'AAPL', '2025-01-28T10:00:00Z', 'buy', 150.50, 100, ...);
-- idempotency_key = hash('webull|AAPL|2025-01-28T10:00:00Z|buy|150.50|100')

-- Second import (same details)
INSERT INTO trades (user_id, broker, symbol_raw, executed_at, side, entry_price, quantity, ...) 
VALUES ('user1', 'webull', 'AAPL', '2025-01-28T10:00:00Z', 'buy', 150.50, 100, ...);
-- ❌ FAILS: Duplicate idempotency_key
```

#### Scenario 3: Different Users, Same Order ID
```sql
-- User 1
INSERT INTO trades (user_id, broker, external_id, symbol, ...) 
VALUES ('user1', 'webull', 'order123', 'AAPL', ...);
-- ✅ SUCCESS: idempotency_key = hash('webull|order123') for user1

-- User 2 (same order ID, different user)
INSERT INTO trades (user_id, broker, external_id, symbol, ...) 
VALUES ('user2', 'webull', 'order123', 'AAPL', ...);
-- ✅ SUCCESS: idempotency_key = hash('webull|order123') for user2
```

## Testing the Migration

### 1. Apply the Migration
```bash
# Apply the migration
supabase db push
```

### 2. Run Tests
```bash
# Run the test script
node scripts/test-idempotency-migration.js
```

### 3. Manual Testing
```sql
-- Test idempotency key generation
SELECT generate_idempotency_key(
    'webull',
    'order123',
    'AAPL',
    '2025-01-28T10:00:00Z'::timestamptz,
    'buy',
    150.50,
    100
);

-- Test duplicate prevention
INSERT INTO trades (user_id, broker, external_id, symbol, ...) 
VALUES ('test-user', 'webull', 'order123', 'AAPL', ...);

-- This should fail
INSERT INTO trades (user_id, broker, external_id, symbol, ...) 
VALUES ('test-user', 'webull', 'order123', 'AAPL', ...);
```

## Benefits

1. **Prevents Duplicate Imports**: Re-importing the same CSV won't create duplicates
2. **User Isolation**: Each user's trades are isolated by user_id
3. **Broker Flexibility**: Works with any broker (webull, td_ameritrade, etc.)
4. **Performance**: Indexes ensure fast lookups and duplicate detection
5. **Metadata Preservation**: Original broker data is preserved in `meta` and `symbol_raw`
6. **Audit Trail**: Complete tracking of import sources and timing

## Rollback

If you need to rollback this migration:

```sql
-- Remove the unique constraint
DROP INDEX IF EXISTS trades_user_idempotency_uidx;

-- Remove the trigger
DROP TRIGGER IF EXISTS trigger_set_trade_idempotency_key ON public.trades;

-- Remove the functions
DROP FUNCTION IF EXISTS public.generate_idempotency_key;
DROP FUNCTION IF EXISTS public.set_trade_idempotency_key;

-- Remove the view
DROP VIEW IF EXISTS public.trades_with_meta;

-- Remove the columns (be careful - this will delete data!)
-- ALTER TABLE public.trades DROP COLUMN IF EXISTS idempotency_key;
-- ALTER TABLE public.trades DROP COLUMN IF EXISTS symbol_raw;
-- ALTER TABLE public.trades DROP COLUMN IF EXISTS meta;
-- ... etc
```

## Notes

- The migration is designed to be safe and non-destructive
- Existing trades will get idempotency_key generated on next update
- The unique constraint only applies when idempotency_key is NOT NULL
- All new columns are nullable to maintain compatibility


