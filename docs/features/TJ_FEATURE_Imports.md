# Trade-Journal Feature Deep Dive: Data Import

**Document Version**: 1.0  
**Last Updated**: 2025-01-18  
**Feature**: CSV Import & Broker Synchronization

---

## 1. User Story / Overview

### What Users See and Can Do

**Import Methods**:
1. **CSV Upload**: Upload trade history CSV files from various brokers
2. **Broker Connection**: Connect broker accounts via SnapTrade for auto-sync
3. **Manual Entry**: Add trades one by one via form (covered in Trades feature)

**Where It Lives**:
- Main import page: `/import`
- Dashboard import: `/dashboard/import`
- Connect brokers: `/connect`

**Workflow**:
1. User uploads CSV file or connects broker
2. System detects broker format automatically
3. User reviews field mappings and data preview
4. User confirms import
5. System processes and deduplicates trades
6. User sees summary (inserted, skipped, errors)

---

## 2. UI Components

### FunctionalCSVImporter (`src/components/import/FunctionalCSVImporter.tsx`)

**Purpose**: Main CSV import wizard with multi-step flow

**Steps**:
1. **File Selection**: Drag-and-drop or browse to select CSV file
2. **Broker Detection**: Auto-detects broker from CSV headers/content
3. **Field Mapping**: Maps CSV columns to trade fields (symbol, side, quantity, price, date, etc.)
4. **Data Preview**: Shows sample of normalized data
5. **Validation**: Checks for errors (missing fields, invalid dates, etc.)
6. **Import**: Processes file and inserts trades

**Supported Brokers**:
- Interactive Brokers (IBKR)
- TD Ameritrade
- E*TRADE
- Robinhood
- Webull
- Tasty Trade
- Schwab
- Fidelity
- Binance (crypto)
- Generic CSV (custom mapping)

**Key Features**:
- **Auto-Detection**: Analyzes first 200 rows to identify broker
- **Preset Mappings**: Pre-configured field mappings for each broker
- **Confidence Score**: Shows detection confidence (e.g., "90% confident this is IBKR")
- **Error Highlighting**: Marks invalid rows in preview
- **Deduplication**: Skips already-imported trades (via `idempotency_key`)

---

## 3. State & Data Fetching

### Import Wizard State Machine

**States**:
- `IDLE`: No file selected
- `DETECTING`: Analyzing CSV for broker detection
- `MAPPING`: User reviewing/editing field mappings
- `VALIDATING`: Checking data for errors
- `UPLOADING`: Sending file to backend
- `PROCESSING`: Backend parsing and inserting trades
- `COMPLETE`: Import finished, showing summary
- `ERROR`: Import failed

**State Transitions**:
```
IDLE → (file upload) → DETECTING → (detection done) → MAPPING
MAPPING → (user confirms) → VALIDATING → (validation passes) → UPLOADING
UPLOADING → (file sent) → PROCESSING → (backend done) → COMPLETE
Any state → (error) → ERROR
ERROR → (retry) → IDLE
```

---

## 4. API Routes

### POST `/api/import/csv` - CSV Import

**File Path**: `Trade-Journal/frontend/app/api/import/csv/route.ts`

**Method**: `POST` (multipart/form-data)

**Authentication**: Required

**Request Body**:
- `file`: CSV file (max 50MB)
- `data`: JSON string with:
  - `fileName`: File name
  - `fileSize`: File size in bytes
  - `broker`: Broker ID (optional, auto-detected if not provided)
  - `preset`: Preset name (optional)
  - `mapping`: Field mapping object (optional, uses preset if not provided)
  - `options`:
    - `skipDuplicates`: Boolean (default true)
    - `normalizeTimestamps`: Boolean (default true)
    - `mapFees`: Boolean (default true)

**Processing Flow**:
1. Validate file (size, MIME type)
2. Create `import_runs` record with status 'processing'
3. Parse CSV using streaming parser (handles large files)
4. Normalize each row using broker adapter
5. Generate `idempotency_key` per row (hash of broker + trade_id + symbol + date)
6. Insert trades with `ON CONFLICT (idempotency_key) DO NOTHING` (deduplication)
7. Update `import_runs` status to 'success' or 'failed'
8. Invalidate trades cache

**Response**:
```json
{
  "success": true,
  "data": {
    "importRunId": "uuid",
    "inserted": 245,
    "skipped": 12,
    "errors": 3,
    "errorDetails": [
      { "row": 157, "message": "Invalid date format" }
    ]
  }
}
```

**Performance**:
- **Streaming**: Parses CSV in chunks (doesn't load entire file into memory)
- **Batch Inserts**: Groups trades into batches of 100 for efficiency
- **Max Limits**: 50MB file size, 100k rows max

---

## 5. Database / Supabase

### `import_runs` Table

**Purpose**: Tracks each import operation

**Columns**:
- `id` (UUID, PK): Import run ID
- `user_id` (UUID, FK): User who initiated import
- `broker_account_id` (UUID, FK): Optional, if imported from connected broker
- `source` (TEXT): 'csv', 'email', 'manual', 'api', 'snaptrade'
- `status` (TEXT): 'pending', 'processing', 'partial', 'success', 'failed'
- `started_at` (TIMESTAMPTZ): When import started
- `finished_at` (TIMESTAMPTZ): When import completed
- `summary` (JSONB): Stats (inserted, skipped, errors)
- `error` (TEXT): Error message if failed

**Relationships**:
- One-to-many with `trades` (via `ingestion_run_id`)

**Usage**:
- Track import history
- Rollback failed imports
- Analytics on import sources

---

## 6. Parsing Engine

**File Path**: `Trade-Journal/frontend/lib/import/parsing/engine.ts`

**Purpose**: Pluggable CSV parsing with broker-specific adapters

**Architecture**:
```
CSV File → parseCsvSample() → detectAdapter() → BrokerAdapter.parseRows() → NormalizedFill[]
```

**Key Types**:

**NormalizedFill** (standardized trade representation):
```typescript
type NormalizedFill = {
  sourceBroker: string;
  assetClass: 'stocks' | 'options' | 'futures' | 'crypto';
  symbol: string;
  underlying?: string;
  expiry?: string;
  strike?: number;
  right?: 'C' | 'P';
  quantity: number; // signed (+buy, -sell)
  price: number;
  fees?: number;
  currency?: string;
  side?: 'BUY' | 'SELL' | 'SHORT' | 'COVER';
  execTime: string; // ISO timestamp
  orderId?: string;
  tradeIdExternal?: string;
  notes?: string;
  raw?: Record<string, any>; // original CSV row for debugging
}
```

**BrokerAdapter Interface**:
```typescript
type BrokerAdapter = {
  id: string; // 'ibkr', 'robinhood', etc.
  detect: (headers: string[], sampleRows: any[]) => DetectionResult | null;
  parseRows: (input: {
    rows: any[];
    headerMap?: Record<string, string>;
    userTimezone?: string;
    assetClass: 'stocks' | 'options' | 'futures' | 'crypto';
  }) => { fills: NormalizedFill[]; warnings: string[]; errors: any[] };
}
```

**Registered Adapters**:
- `ibkrAdapter`: Interactive Brokers
- `robinhoodAdapter`: Robinhood
- `webullAdapter`: Webull
- `tastytradeAdapter`: Tasty Trade
- `tdAmeritradeAdapter`: TD Ameritrade
- `etradeAdapter`: E*TRADE
- `schwabAdapter`: Charles Schwab
- `fidelityAdapter`: Fidelity
- `binanceusAdapter`: Binance US

**Adapter Registration**:
```typescript
registerAdapter(ibkrAdapter);
registerAdapter(robinhoodAdapter);
// ... etc.
```

**Detection Logic**:
- Each adapter's `detect()` function checks CSV headers and sample rows
- Returns `DetectionResult` with confidence score (0.0-1.0)
- Highest confidence adapter is selected
- Fallback to "generic" if confidence < 0.7

---

## 7. Broker-Specific Handling

### Interactive Brokers (IBKR)

**Detection**: Looks for headers like "Symbol", "Date/Time", "Quantity", "T. Price", "Comm/Fee"

**Normalization**:
- Date format: `MM/DD/YYYY, HH:MM:SS` → ISO 8601
- Options format: `AAPL 240119C00170000` (OCC format) → parsed into components
- Side: "Buy" / "Sell" → "BUY" / "SELL"
- Fees: Sums "Comm/Fee", "Regulatory Fees", "Sec Fee", "NFA Fee"

### Robinhood

**Supported Format**: Robinhood Activity CSV Export

**CSV Header Format**:
```
"Activity Date","Process Date","Settle Date","Instrument","Description","Trans Code","Quantity","Price","Amount"
```

**Trade Codes Supported** (imported as trades):
- `BTO` → Buy To Open (options)
- `STC` → Sell To Close (options)
- `Buy` → Stock/ETF buy
- `Sell` → Stock/ETF sell

**Non-Trade Codes** (currently ignored):
- `ACH` → ACH deposits/withdrawals
- `RTP` → Instant bank transfer
- `DCF` → Debit card transfer
- `GOLD` → Robinhood Gold subscription fee
- `INT` → Interest payment
- `CDIV` → Cash dividend
- `REC` → Reconciliation/adjustment rows
- `OEXP` → Option expiration (TODO: handle in future iteration for auto-closing expired options)

**Field Mapping**:
- **Activity Date** (MM/DD/YYYY) → `executed_at`
- **Instrument** → `symbol` (for stocks) or `underlying` (for options)
- **Description** → Used to parse option details (expiry, strike, type) and extract symbol for stock trades
- **Trans Code** → `side` (BTO/Buy → BUY, STC/Sell → SELL)
- **Quantity** → `quantity` (positive for buys, negative for sells)
- **Price** → `price` (parsed from format like "$3.05" or "($209.03)")
- **Amount** → `gross_amount` (parsed from format like "$304.95" or "($209.03)")

**Option Parsing**:
- Description format: `"NVDA 6/28/2024 Call $125.00"` or `"SPY 6/24/2024 Put $545.00"`
- Extracts: underlying symbol, expiration date (MM/DD/YYYY → ISO), option type (CALL/PUT), strike price
- Sets `assetClass: 'options'` and populates `underlying`, `expiry`, `strike`, `right` fields

**Stock Parsing**:
- Description format: `"Bought 10.0000 AAPL @ 175.00"` or `"Sold 10.0000 AAPL @ 180.00"`
- Extracts symbol from Instrument column or from description if Instrument is empty
- Sets `assetClass: 'EQUITY'`

**Idempotency**: Uses hash of `activityDate + description + transCode + quantity + price + amount`

**Notes**:
- Money values are parsed handling `$`, commas, and parentheses (negative values)
- Footer/disclaimer rows are automatically skipped
- Empty rows and rows with missing Trans Code are skipped

**Legacy Format Support**: The adapter also supports older Robinhood CSV formats with headers like "Date", "Symbol", "Side", "Quantity", "Price" for backward compatibility.

### Webull

**Detection**: Looks for "Time Filled", "Symbol", "Side", "Filled/Quantity", "Filled Average Price"

**Normalization**:
- Date format: `MM/DD/YYYY HH:MM:SS` → ISO 8601
- Timezone: Defaults to EST (US market hours)
- Fees: Typically 0 (commission-free)

### Options-Specific Parsing

**OCC Format**: `SPY 231215C00450000`
- Underlying: `SPY`
- Expiry: `231215` → `2023-12-15`
- Right: `C` (Call) or `P` (Put)
- Strike: `00450000` → `450.00` (divide by 1000)

**Human-Readable Format**: `AAPL Jan 19 2024 $170 Call`
- Parsed via regex
- Converted to standard format

---

## 8. Deduplication & Idempotency

### Idempotency Key Generation

**Purpose**: Prevent duplicate imports of same trade

**Key Format**:
```typescript
idempotency_key = hash(user_id + broker + broker_trade_id + symbol + executed_at)
```

**Example**:
```
User: user-abc123
Broker: robinhood
Broker Trade ID: RH-TR-987654
Symbol: AAPL
Executed: 2025-01-15T14:30:00Z

→ idempotency_key: "sha256(user-abc123:robinhood:RH-TR-987654:AAPL:2025-01-15T14:30:00Z)"
→ Result: "8f3d2a1b..."
```

**Database Constraint**:
```sql
CREATE UNIQUE INDEX trades_idempotency_key_user_id_idx 
  ON trades (idempotency_key, user_id);
```

**Behavior on Duplicate**:
- `ON CONFLICT (idempotency_key, user_id) DO NOTHING`
- Trade is skipped (counted in `skipped` stats)
- No error thrown
- Original import run preserved

---

## 9. Edge Cases & TODOs

### Known TODOs

1. **Email Import**
   - **Status**: Partially implemented infrastructure
   - **Goal**: Parse trade confirms from broker emails
   - **Challenge**: Each broker has different email format

2. **Excel File Support**
   - **Status**: Not implemented
   - **Request**: Support `.xlsx` files directly (currently must save as CSV)
   - **Fix**: Add `xlsx` library, convert to CSV internally

3. **Import Rollback**
   - **Status**: Database supports it (via `ingestion_run_id`) but no UI
   - **Need**: "Undo Import" button to delete all trades from a run
   - **Fix**: Add DELETE API that cascades by `ingestion_run_id`

4. **Real-Time Progress**
   - **Status**: Backend processes entire file before responding
   - **Need**: Real-time progress bar (e.g., "Processing row 1500/5000")
   - **Fix**: Use WebSockets or Server-Sent Events for progress updates

5. **Custom Preset Saving**
   - **Status**: Users can create custom mappings but can't save them
   - **Need**: "Save as Preset" button to store custom broker mappings
   - **Fix**: Add `import_mapping_presets` table support (table exists, UI missing)

### Edge Cases

1. **Timezone Handling**
   - **Issue**: Broker CSVs often don't include timezone
   - **Solution**: Default to EST for US brokers, UTC for international
   - **User Override**: Allow manual timezone selection in UI

2. **Symbol Normalization**
   - **Issue**: Same stock has different symbols (e.g., "BRK.B" vs "BRK-B")
   - **Solution**: `symbol_raw` stores original, `symbol` stores normalized
   - **Normalization Rules**: Remove dots, standardize separators

3. **Partial Imports**
   - **Scenario**: 1000 rows, 950 succeed, 50 fail
   - **Behavior**: Import marked as 'partial', successful rows inserted, errors logged
   - **User Action**: Can retry failed rows or manually fix

4. **Multi-Currency**
   - **Issue**: International brokers have trades in USD, EUR, GBP, etc.
   - **Current**: `currency` field stored but not used for analytics
   - **TODO**: Convert all P&L to user's base currency

5. **Corporate Actions**
   - **Issue**: Stock splits, reverse splits, mergers change symbols/quantities
   - **Current**: Not automatically handled
   - **TODO**: Integrate with `corporate_actions` table for split adjustments

---

## 10. Integration with SnapTrade (Broker Connections)

**File Path**: `/connect` page, `/api/snaptrade/*` endpoints

**Flow**:
1. User clicks "Connect Broker" → Redirects to SnapTrade portal
2. User authenticates with broker (OAuth)
3. SnapTrade syncs holdings, orders, activities
4. Data stored in `snaptrade_accounts`, `snaptrade_connections`
5. Periodic sync (every 24 hours or manual trigger)
6. Synced trades auto-deduplicated (same `idempotency_key` mechanism)

**Advantages over CSV**:
- **Automatic**: No manual uploads
- **Real-Time**: Near-instant sync (vs. downloading CSV from broker)
- **Complete**: Captures all trades, not just what user exports

**Covered in Detail**: See `TJ_FEATURE_BrokerConnections.md`

---

**End of Document**

