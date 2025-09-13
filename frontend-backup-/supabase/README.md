# Trading Database Schema

This document describes the complete database schema for the trading journal application, implemented in Supabase with PostgreSQL.

## Overview

The schema follows a **raw → parsed → normalized** pattern for importing and processing trading data:

1. **Raw Import**: CSV/API data is stored as-is in `raw_import_items`
2. **Parsed Data**: Raw data is parsed into normalized `executions_normalized` records
3. **Grouped Trades**: Executions are grouped into `trades` for position tracking

## Tables

### Core Tables

#### `broker_accounts`
Stores connected broker accounts (currently disabled until live APIs).

```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- broker: TEXT (td_ameritrade, etrade, fidelity, robinhood, ibkr, tastyworks)
- label: TEXT
- status: TEXT (disabled, connected, error, expired)
- connected_at: TIMESTAMPTZ
- access_token_enc: TEXT (encrypted)
- refresh_token_enc: TEXT (encrypted)
- expires_at: TIMESTAMPTZ
- account_ids: JSONB
- created_at, updated_at: TIMESTAMPTZ
```

#### `import_runs`
Tracks import sessions from various sources.

```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- broker_account_id: UUID (FK to broker_accounts, nullable)
- source: TEXT (csv, email, manual, api)
- status: TEXT (pending, processing, partial, success, failed)
- started_at, finished_at: TIMESTAMPTZ
- summary: JSONB
- error: TEXT
- created_at: TIMESTAMPTZ
```

#### `raw_import_items`
Stores raw data from imports before parsing.

```sql
- id: UUID (PK)
- import_run_id: UUID (FK to import_runs)
- user_id: UUID (FK to auth.users)
- source_line: INTEGER
- raw_payload: JSONB
- status: TEXT (parsed, error, duplicate)
- error: TEXT
- created_at: TIMESTAMPTZ
```

#### `executions_normalized`
Atomic fill records (the core trading data).

```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- broker_account_id: UUID (FK to broker_accounts, nullable)
- source_import_run_id: UUID (FK to import_runs, nullable)
- instrument_type: TEXT (equity, option, futures)
- symbol: TEXT
- occ_symbol: TEXT (for options)
- futures_symbol: TEXT (for futures)
- side: TEXT (buy, sell, short, cover)
- quantity: NUMERIC
- price: NUMERIC
- fees: NUMERIC
- currency: TEXT
- timestamp: TIMESTAMPTZ
- venue: TEXT
- order_id: TEXT
- exec_id: TEXT
- multiplier: NUMERIC
- expiry: DATE (for options/futures)
- strike: NUMERIC (for options)
- option_type: TEXT (C, P)
- underlying: TEXT (for options)
- notes: TEXT
- unique_hash: TEXT (UNIQUE, auto-computed)
- created_at: TIMESTAMPTZ
```

#### `trades`
Grouped position records (multiple executions = one trade).

```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- group_key: TEXT (for grouping related executions)
- instrument_type: TEXT (equity, option, futures)
- symbol: TEXT
- opened_at, closed_at: TIMESTAMPTZ
- qty_opened, qty_closed: NUMERIC
- avg_open_price, avg_close_price: NUMERIC
- realized_pnl: NUMERIC
- fees: NUMERIC
- legs: JSONB (for multi-leg strategies)
- status: TEXT (open, closed)
- created_at, updated_at: TIMESTAMPTZ
```

### Reference Tables

#### `instruments`
Master instrument definitions.

```sql
- id: UUID (PK)
- instrument_type: TEXT (equity, option, futures)
- unique_symbol: TEXT (UNIQUE)
- multiplier: NUMERIC
- exchange: TEXT
- meta: JSONB
- created_at, updated_at: TIMESTAMPTZ
```

#### `instrument_aliases`
Symbol aliases for different data sources.

```sql
- id: UUID (PK)
- instrument_id: UUID (FK to instruments)
- alias_symbol: TEXT
- source: TEXT
- created_at: TIMESTAMPTZ
- UNIQUE(alias_symbol, source)
```

#### `corporate_actions`
Stock splits, dividends, and OCC adjustments.

```sql
- id: UUID (PK)
- symbol: TEXT
- type: TEXT (split, dividend, occ_adjustment)
- effective_date: DATE
- factor: NUMERIC
- memo_url: TEXT
- payload: JSONB
- created_at: TIMESTAMPTZ
```

## Indexes

### Performance Indexes
- `idx_broker_accounts_user_id` - User's broker accounts
- `idx_import_runs_user_id` - User's import runs
- `idx_import_runs_status` - Import status filtering
- `idx_raw_import_items_import_run_id` - Import run items
- `idx_raw_import_items_user_id` - User's raw items
- `idx_executions_normalized_user_id_timestamp` - **Key index** for user's executions
- `idx_executions_normalized_unique_hash` - Duplicate detection
- `idx_executions_normalized_symbol` - Symbol filtering
- `idx_executions_normalized_broker_account_id` - Broker filtering
- `idx_trades_user_id_opened_at` - **Key index** for user's trades
- `idx_trades_status` - Trade status filtering
- `idx_trades_symbol` - Symbol filtering
- `idx_trades_group_key` - Trade grouping
- `idx_instruments_unique_symbol` - Instrument lookup
- `idx_instrument_aliases_alias_symbol` - Alias lookup
- `idx_corporate_actions_symbol_effective_date` - Corporate actions

## Row Level Security (RLS)

All tables have RLS enabled with user-specific policies:

### User-Owned Data
- `broker_accounts`, `import_runs`, `raw_import_items`, `executions_normalized`, `trades`
- Users can only access rows where `user_id = auth.uid()`

### Shared Reference Data
- `instruments`, `instrument_aliases`, `corporate_actions`
- All authenticated users can read/write (shared reference data)

## Functions & Triggers

### Unique Hash Function
```sql
compute_execution_hash(timestamp, symbol, side, quantity, price, broker_account_id)
```
- Computes SHA256 hash for duplicate detection
- Format: `timestamp|symbol|side|abs(quantity)|price|broker_id`
- Automatically triggered on INSERT/UPDATE

### Updated At Triggers
- Automatically updates `updated_at` timestamp on record changes
- Applied to: `broker_accounts`, `trades`, `instruments`

## Data Flow

### Import Process
1. **Create Import Run**: User initiates import from CSV/API
2. **Store Raw Data**: Each line stored in `raw_import_items`
3. **Parse & Normalize**: Raw data parsed into `executions_normalized`
4. **Group Trades**: Related executions grouped into `trades`
5. **Update Status**: Import run marked as success/failed

### Trade Grouping
- Executions are grouped by `group_key` (symbol + date)
- Multiple executions can form one trade position
- Trades track open/close quantities and P&L

### Duplicate Prevention
- `unique_hash` prevents duplicate executions
- Hash includes: timestamp, symbol, side, quantity, price, broker
- Automatic detection during import process

## Usage Examples

### Create Import Run
```typescript
const importRun = await importRunsService.create({
  user_id: userId,
  source: 'csv',
  status: 'pending'
})
```

### Store Raw Data
```typescript
const rawItems = await rawImportItemsService.createMany([
  {
    import_run_id: importRun.id,
    user_id: userId,
    source_line: 1,
    raw_payload: { /* CSV row data */ },
    status: 'parsed'
  }
])
```

### Create Execution
```typescript
const execution = await executionsService.create({
  user_id: userId,
  instrument_type: 'equity',
  symbol: 'AAPL',
  side: 'buy',
  quantity: 100,
  price: 150.50,
  timestamp: '2024-01-15T10:30:00Z'
  // unique_hash computed automatically
})
```

### Group into Trade
```typescript
const trade = await tradesService.create({
  user_id: userId,
  group_key: tradingUtils.generateTradeGroupKey('AAPL', '2024-01-15'),
  instrument_type: 'equity',
  symbol: 'AAPL',
  opened_at: '2024-01-15T10:30:00Z',
  qty_opened: 100,
  avg_open_price: 150.50,
  status: 'open'
})
```

## Migration Files

1. `20250101000000_create_trading_schema.sql` - Main schema creation
2. `20250101000001_test_trading_schema.sql` - Verification tests

## TypeScript Integration

The schema is fully typed with TypeScript interfaces in `lib/types/trading.ts` and database service layer in `lib/database/trading.ts`.

## Security Considerations

- All user data is protected by RLS
- Sensitive tokens are encrypted in `broker_accounts`
- Unique hashes prevent data duplication
- Audit trails via `created_at`/`updated_at` timestamps
