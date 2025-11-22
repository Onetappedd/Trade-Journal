# Robinhood CSV Trade Matching System

## Overview

This document explains how the trade matching system processes Robinhood Activity CSV files and converts individual trade executions into complete, matched trades with accurate P&L calculations.

---

## Phase 1: CSV Detection & Parsing

### Step 1: Detection (`robinhoodDetect`)

The system scans CSV headers to identify Robinhood Activity CSV format:

**Required Headers (case-insensitive):**
- "Activity Date"
- "Process Date"
- "Settle Date"
- "Instrument"
- "Description"
- "Trans Code"
- "Quantity"
- "Price"
- "Amount"

**Process:**
1. Maps CSV headers to normalized field names (handles case variations)
2. Returns a `DetectionResult` with:
   - `brokerId: 'robinhood'`
   - `confidence: 0.9+` (if all required headers found)
   - `headerMap`: Maps normalized names → actual CSV column names

---

### Step 2: Parsing (`robinhoodParse`)

**Row Filtering:**
- **Skips non-trade rows:**
  - `ACH` (Automated Clearing House transfers)
  - `RTP` (Real-Time Payments)
  - `DCF` (Dividend Capital Flow)
  - `GOLD` (Gold purchases)
  - `INT` (Interest)
  - `CDIV` (Capital Dividends)
  - `REC` (Record keeping)
  
- **Includes trade rows:**
  - `BTO` (Buy To Open - options)
  - `STC` (Sell To Close - options)
  - `Buy` (Stock/ETF buy)
  - `Sell` (Stock/ETF sell)
  - `OEXP` (Option Expiration - treated as Sell To Close with price 0)

- **Skips:**
  - Empty rows
  - Rows with mismatched column counts
  - Footer/disclaimer rows (contains "the data provided is for your convenience")

**Data Extraction:**

1. **Date Parsing:**
   - Uses "Activity Date" as execution timestamp
   - Converts MM/DD/YYYY format to ISO 8601 with timezone

2. **Quantity Parsing:**
   - Handles regular numbers: `10` → `10`
   - Handles OEXP format: `5S` → `5` (extracts number before "S")
   - Skips rows with zero quantity

3. **Price & Amount Parsing:**
   - Uses `parseMoney()` helper function
   - Handles:
     - Dollar signs: `$125.00` → `125.00`
     - Commas: `$1,250.00` → `1250.00`
     - Parentheses for negatives: `($50.00)` → `-50.00`
   - OEXP rows: Sets price and amount to `0` (expired worthless)

4. **Side Determination:**
   - `BTO` or `Buy` → `BUY` (quantity positive)
   - `STC`, `Sell`, or `OEXP` → `SELL` (quantity negative)

5. **Option Detection:**
   - Detects if trade is an option if:
     - `Trans Code` is `BTO`, `STC`, or `OEXP`
     - Description contains "Call" or "Put"
     - Description contains "Option Expiration"
   
   - Parses option details from description:
     - Format: `"NVDA 6/28/2024 Call $125.00"`
     - Extracts:
       - `underlying`: "NVDA"
       - `expiry`: "2024-06-28" (converted to ISO date)
       - `strike`: 125.00
       - `type`: "C" (Call) or "P" (Put)
     - Format: `"Option Expiration for ACB 4/26/2024 Call $9.00"`
     - Same parsing logic applies

6. **Symbol Extraction:**
   - Primary: From "Instrument" column
   - Fallback: Extracted from description (e.g., "Bought 10.0000 AAPL @ 175.00")

**Output: `NormalizedFill` Objects**

Each parsed row becomes a `NormalizedFill`:

```typescript
{
  sourceBroker: 'robinhood',
  assetClass: 'stocks' | 'options',
  symbol: 'AAPL' | 'NVDA',
  underlying: 'NVDA' (for options),
  expiry: '2024-06-28' (for options),
  strike: 125 (for options),
  right: 'C' | 'P' (for options),
  quantity: +10 (buy) or -10 (sell),
  price: 2.50,
  fees: 0, // Robinhood doesn't break out fees separately
  currency: 'USD',
  side: 'BUY' | 'SELL',
  execTime: '2024-06-15T10:30:00Z',
  tradeIdExternal: <idempotency_key>,
  notes: <original_description>
}
```

**Idempotency Key:**
- Generated hash: `hash(user_id + broker + activity_date + description + trans_code + quantity + price + amount)`
- Prevents duplicate imports of the same row

---

## Phase 2: Execution Storage

### Step 3: Insert into `executions_normalized` Table

Each `NormalizedFill` is converted to an execution record and stored:

**Data Transformation:**
- `assetClass: 'stocks'` → `instrument_type: 'equity'`
- `assetClass: 'options'` → `instrument_type: 'option'`
- `quantity: -10` → `quantity: 10` (absolute value, side stored separately)
- `side: 'BUY'` → `side: 'buy'` (lowercase)
- `multiplier: 100` for options, `1` for stocks

**Execution Record:**
```typescript
{
  user_id: userId,
  source_import_run_id: importRunId,
  instrument_type: 'equity' | 'option' | 'futures',
  symbol: 'AAPL',
  side: 'buy' | 'sell',
  quantity: 10, // Always positive (absolute value)
  price: 2.50,
  fees: 0,
  currency: 'USD',
  timestamp: '2024-06-15T10:30:00Z',
  venue: 'robinhood',
  order_id: <generated_or_from_fill>,
  exec_id: <idempotency_key>,
  multiplier: 100 (for options) | 1 (for stocks),
  expiry: '2024-06-28' (for options),
  strike: 125 (for options),
  option_type: 'C' | 'P' (for options),
  underlying: 'NVDA' (for options),
  unique_hash: <computed_hash>,
  notes: <original_description>
}
```

**Duplicate Prevention:**
- Uses `upsert` with `unique_hash` as conflict key
- If `unique_hash` already exists, updates the record instead of creating duplicate
- Option to skip duplicates entirely if `skipDuplicates` flag is set

---

## Phase 3: Trade Matching Engine

### Step 4: Matching (`matchUserTrades`)

**Entry Point:**
- Fetches all executions from `executions_normalized` for the user
- Filters by:
  - `user_id`
  - `source_import_run_id` (optional - for specific import)
  - `symbol` (optional - for specific symbols)
- Orders by `timestamp` (ascending - oldest first)

**Splitting by Asset Class:**
- Separates executions into three groups:
  - `equityExecutions`: `instrument_type === 'equity'`
  - `optionExecutions`: `instrument_type === 'option'`
  - `futureExecutions`: `instrument_type === 'futures'`

**Routing:**
- Routes each group to specialized matching function:
  - `matchEquities()` → FIFO matching for stocks
  - `matchOptions()` → Multi-leg window matching for options
  - `matchFutures()` → Similar to equities for futures

---

## Phase 4A: Equity Matching (FIFO)

### Step 5: `matchEquities` Function

**Grouping:**
- Groups executions by:
  - `symbol` (e.g., "AAPL")
  - `broker_account_id` (if available)
- Sorts each group by `timestamp` (oldest first)

**FIFO Matching Algorithm:**

For each execution in chronological order:

1. **Calculate New Position:**
   ```typescript
   signedQty = exec.side === 'buy' ? +exec.quantity : -exec.quantity
   newPosition = currentPosition + signedQty
   ```

2. **If Position Direction Unchanged:**
   - Both positive (accumulating long) or both negative (accumulating short)
   - Update existing open trade:
     ```typescript
     // Weighted average price calculation
     totalCost = (currentQty * currentAvgPrice) + (execQty * execPrice)
     newQty = currentQty + execQty
     newAvgPrice = totalCost / newQty
     
     // Update trade
     openTrade.qty_opened = newQty
     openTrade.avg_open_price = newAvgPrice
     openTrade.fees += exec.fees
     ```

3. **If Position Direction Changes (Crosses Zero):**
   - Position changes from positive to negative (or vice versa)
   - Close current open trade:
     ```typescript
     closeQty = Math.abs(currentPosition) // Amount to close
     realizedPnl = (execPrice - openTrade.avg_open_price) * closeQty - totalFees
     
     openTrade.status = 'closed'
     openTrade.closed_at = exec.timestamp
     openTrade.qty_closed = closeQty
     openTrade.avg_close_price = execPrice
     openTrade.realized_pnl = realizedPnl
     ```
   - If remaining quantity after close:
     - Start new trade in opposite direction
     - Set new `opened_at`, `avg_open_price`, etc.

**Example Flow:**

```
Execution 1: BUY 10 AAPL @ $150.00
  → Open trade created: +10 shares @ $150.00 (status: open)

Execution 2: BUY 5 AAPL @ $155.00
  → Update open trade:
     Total cost: (10 * $150) + (5 * $155) = $2,275
     New quantity: 15 shares
     New avg price: $2,275 / 15 = $151.67
     Status: still open

Execution 3: SELL 8 AAPL @ $160.00
  → Close 8 shares:
     P&L = ($160.00 - $151.67) * 8 = $66.64
     Closed trade: 8 shares @ $151.67 → $160.00, P&L = $66.64
     Remaining: 7 shares @ $151.67 (still open)

Execution 4: SELL 7 AAPL @ $162.00
  → Close remaining 7 shares:
     P&L = ($162.00 - $151.67) * 7 = $72.31
     Closed trade: 7 shares @ $151.67 → $162.00, P&L = $72.31
     All shares closed
```

**Final Trade Records:**
- Closed trades: Saved to `trades` table with `status: 'closed'`
- Open trades: Saved with `status: 'open'` (if position still open at end)

---

## Phase 4B: Options Matching (Multi-leg within Window)

### Step 6: `matchOptions` Function

**Grouping:**
- Groups executions by: `underlying + expiry`
  - Key format: `"NVDA::2024-06-28"`
- Sorts each group by `timestamp` (oldest first)

**Windowing:**
- Groups executions into "windows" (related executions):
  - Same `order_id`, OR
  - Within ±60 seconds of each other
- This handles multi-leg option strategies (spreads, straddles, etc.)

**Leg Tracking:**

For each execution in a window:

```typescript
legKey = `${strike}-${type}-${side}` // e.g., "125-call-buy"

// Calculate signed quantity
qty = exec.side === 'sell' ? -Math.abs(exec.quantity) : Math.abs(exec.quantity)

// Calculate cost (for options, multiply by 100)
cost = qty * exec.price * exec.multiplier // multiplier = 100 for options

// Update or create leg
if (!legs.has(legKey)) {
  legs.set(legKey, {
    symbol: `${underlying}${expiry}${strike}${type}`,
    qty: 0,
    avg_price: 0,
    total_cost: 0,
    total_fees: 0
  })
}

const leg = legs.get(legKey)
leg.qty += qty
leg.total_cost += cost
leg.total_fees += exec.fees
leg.avg_price = leg.total_cost / (Math.abs(leg.qty) * multiplier)
```

**Trade Completion:**
- Trade closes when:
  - All legs net to zero (all positions closed)
  - Or all legs are explicitly closed
- Calculates total P&L:
  ```typescript
  totalPnl = sum(leg_pnl) - total_fees
  leg_pnl = (leg.close_price - leg.avg_open_price) * leg.qty_closed * multiplier
  ```

**Example Flow:**

```
Execution 1: BTO 1 NVDA 6/28/2024 Call $125 @ $2.50
  → Window 1 created
     Leg: "125-call-buy" → +1 contract @ $2.50
     Status: open

Execution 2: STC 1 NVDA 6/28/2024 Call $125 @ $3.00 (within 60s)
  → Same window
     Leg: "125-call-buy" → 0 contracts (closed)
     P&L: ($3.00 - $2.50) * 1 * 100 = $50.00
     Trade closed

Execution 3: BTO 2 NVDA 6/28/2024 Put $120 @ $1.50
  → New window 2
     Leg: "120-put-buy" → +2 contracts @ $1.50
     Status: open

Execution 4: BTO 1 NVDA 6/28/2024 Call $125 @ $2.00 (within 60s)
  → Same window 2 (spread strategy)
     Leg: "125-call-buy" → +1 contract @ $2.00
     Status: open (multi-leg trade)

Execution 5: STC 2 NVDA 6/28/2024 Put $120 @ $1.75 (within 60s)
  → Same window 2
     Leg: "120-put-buy" → 0 contracts (closed)
     Leg P&L: ($1.75 - $1.50) * 2 * 100 = $50.00
     Status: partially closed

Execution 6: STC 1 NVDA 6/28/2024 Call $125 @ $2.25
  → Same window 2
     Leg: "125-call-buy" → 0 contracts (closed)
     Leg P&L: ($2.25 - $2.00) * 1 * 100 = $25.00
     Total P&L: $50.00 + $25.00 = $75.00
     Trade fully closed
```

**Final Trade Record:**
```typescript
{
  symbol: 'NVDA',
  instrument_type: 'option',
  status: 'closed',
  opened_at: '2024-06-15T10:30:00Z',
  closed_at: '2024-06-20T14:00:00Z',
  qty_opened: 3, // Total contracts opened
  qty_closed: 3, // Total contracts closed
  avg_open_price: <weighted_average>,
  avg_close_price: <weighted_average>,
  realized_pnl: 75.00,
  legs: [
    { strike: 120, type: 'put', side: 'buy', qty_opened: 2, qty_closed: 2, ... },
    { strike: 125, type: 'call', side: 'buy', qty_opened: 1, qty_closed: 1, ... }
  ]
}
```

---

## Phase 5: Trade Record Creation

### Step 7: Final Trade Records in `trades` Table

**Trade Schema:**
```typescript
{
  id: <uuid>,
  user_id: <userId>,
  group_key: <unique_key_per_trade>,
  symbol: 'AAPL',
  instrument_type: 'equity' | 'option' | 'futures',
  status: 'open' | 'closed',
  opened_at: '2024-06-15T10:30:00Z',
  closed_at: '2024-06-20T14:00:00Z' (if closed),
  qty_opened: 15,
  qty_closed: 15 (if closed),
  avg_open_price: 151.67,
  avg_close_price: 161.00 (if closed),
  realized_pnl: 138.95 (if closed),
  unrealized_pnl: null (calculated on-the-fly for open trades),
  fees: 0,
  legs: [...] (for options, contains all leg details),
  ingestion_run_id: <import_run_id>,
  created_at: <timestamp>,
  updated_at: <timestamp>
}
```

**Database Operations:**
- Uses `upsert` to handle both new trades and updates to existing trades
- `group_key` ensures trades are uniquely identified
- `row_hash` (from executions) links back to original CSV rows

---

## Key Features

### 1. Idempotency
- **Unique Hash:** Each execution has a `unique_hash` computed from row data
- **Duplicate Prevention:** Prevents importing the same CSV row twice
- **Re-import Safety:** Re-importing the same file updates existing records instead of creating duplicates

### 2. FIFO Matching (Equities)
- **First-In, First-Out:** Oldest executions are matched first
- **Accurate Cost Basis:** Weighted average pricing ensures accurate entry prices
- **Partial Closes:** Handles partial position closes correctly

### 3. Multi-leg Options Matching
- **Time Windows:** Groups related option executions within ±60 seconds
- **Leg Tracking:** Tracks each leg of complex strategies separately
- **Spread Support:** Handles spreads, straddles, iron condors, etc.

### 4. Weighted Average Pricing
- **Accurate Entry Prices:** Calculates true average cost basis
- **Multiple Fills:** Handles multiple fills at different prices correctly
- **Formula:** `avg_price = sum(quantity * price) / sum(quantity)`

### 5. Automatic P&L Calculation
- **Realized P&L:** Calculated when trades close
- **Formula (Equities):** `(close_price - avg_open_price) * quantity - fees`
- **Formula (Options):** `sum((close_price - avg_open_price) * quantity * multiplier) - fees`
- **Precision:** Uses `Decimal.js` for financial calculations to avoid floating-point errors

### 6. Partial Fills
- **Accumulation:** Multiple buys accumulate into single open position
- **Partial Closes:** Can close part of a position, leaving remainder open
- **Direction Changes:** Handles position reversals (long → short or vice versa)

---

## Error Handling

### Parse Errors
- Invalid dates → Logged as error, row skipped
- Missing required fields → Logged as error, row skipped
- Invalid price/quantity → Logged as error, row skipped
- All errors collected and returned in import result

### Matching Errors
- Missing executions → Trade remains open
- Invalid execution data → Logged, execution skipped
- Database errors → Transaction rolled back, error returned

### Validation
- Schema validation on all database inserts
- Type checking for all numeric fields
- Date format validation
- Symbol format validation

---

## Performance Considerations

### Batch Processing
- Executions inserted in chunks (100 at a time)
- Matching processes all executions in memory
- Database operations batched where possible

### Indexing
- `executions_normalized.unique_hash` → Unique index (prevents duplicates)
- `executions_normalized.user_id + timestamp` → Indexed for fast queries
- `trades.user_id + symbol` → Indexed for fast lookups

### Scalability
- Handles thousands of executions per import
- Efficient grouping and sorting algorithms
- Minimal database round-trips

---

## Example: Complete Flow

**Input CSV Row:**
```csv
Activity Date,Process Date,Settle Date,Instrument,Description,Trans Code,Quantity,Price,Amount
06/15/2024,06/16/2024,06/17/2024,AAPL,Bought 10.0000 AAPL @ 175.00,Buy,10,$175.00,$1,750.00
```

**Step 1-2: Parsing**
- Detected as Robinhood Activity CSV
- Parsed to `NormalizedFill`:
  ```typescript
  {
    sourceBroker: 'robinhood',
    assetClass: 'stocks',
    symbol: 'AAPL',
    quantity: 10,
    price: 175.00,
    side: 'BUY',
    execTime: '2024-06-15T00:00:00Z',
    tradeIdExternal: <hash>
  }
  ```

**Step 3: Execution Storage**
- Inserted into `executions_normalized`:
  ```typescript
  {
    user_id: <userId>,
    instrument_type: 'equity',
    symbol: 'AAPL',
    side: 'buy',
    quantity: 10,
    price: 175.00,
    timestamp: '2024-06-15T00:00:00Z',
    unique_hash: <hash>
  }
  ```

**Step 4-5: Matching**
- If no existing open AAPL position:
  - Creates new open trade: `+10 shares @ $175.00`
- If existing open position:
  - Updates average price (weighted average)
  - Updates quantity opened

**Step 6-7: Trade Record**
- Saved to `trades` table:
  ```typescript
  {
    symbol: 'AAPL',
    instrument_type: 'equity',
    status: 'open',
    qty_opened: 10,
    avg_open_price: 175.00,
    opened_at: '2024-06-15T00:00:00Z'
  }
  ```

---

## Files Involved

- **Parsing:** `lib/import/parsing/engine.ts` (robinhoodAdapter)
- **Import API:** `app/api/import/csv/route.ts`
- **Matching Engine:** `lib/matching/engine.ts`
- **Math Utilities:** `lib/math/money.ts` (Decimal.js calculations)

---

## Database Tables

1. **`import_runs`**: Tracks CSV import jobs
2. **`executions_normalized`**: Raw trade executions (one row per CSV trade row)
3. **`trades`**: Matched, complete trades (buy + sell pairs)

---

## Notes

- **Fees:** Robinhood Activity CSV doesn't break out fees separately, so fees are set to `0`
- **Options Multiplier:** Always `100` for options (standard contract size)
- **Timezone:** All dates normalized to UTC
- **Currency:** Assumes USD (Robinhood US accounts)

