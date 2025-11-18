# Trade-Journal Feature Deep Dive: Trade Management

**Document Version**: 1.0  
**Last Updated**: 2025-01-18  
**Feature**: Trade Journaling & Management

---

## 1. User Story / Overview

### What Users See and Can Do

**Core Capabilities**:
- View comprehensive list of all trades (paginated, filterable, sortable)
- Filter trades by: symbol, asset type, side (buy/sell), date range, status
- Search trades by symbol name
- View trade details including P&L, fees, quantities, timestamps
- Export trade data to CSV
- Manually add new trades
- View trade history organized by date
- Track open vs. closed positions

**Where It Lives in the UI**:
- Main trade list: `/trades`
- Dashboard-embedded trades: `/dashboard/trades`
- Trade history view: `/trade-history`
- Add trade page: `/add-trade` or `/trades/add`
- Trade journal: `/journal`

### Core Functionality

1. **Trade List Display**: Paginated, virtualized table for performance with large datasets
2. **Server-Side Filtering**: Efficient filtering and sorting handled by backend
3. **Real-Time P&L Calculation**: Calculates realized P&L based on entry/exit prices
4. **Multi-Asset Support**: Equities, options, futures, crypto
5. **Trade Matching**: Automatically matches executions into complete trade records
6. **Idempotency**: Prevents duplicate imports via hash-based deduplication
7. **Notes & Tags**: Add contextual information to trades (partially implemented)

---

## 2. UI Components

### Trades Client Component (`app/trades/trades-client.tsx`)

**File Path**: `Trade-Journal/frontend/app/trades/trades-client.tsx`

**Purpose**: Main client-side trade list with filtering and display

**Component Structure**:
- Client component (`"use client"`)
- Fetches trades via `/api/trades`
- Client-side filtering for real-time UI updates
- Table display with sorting and formatting

**Key Features**:
- **Search**: Filter by symbol (client-side, instant feedback)
- **Asset Filter**: Equity, Option, Crypto dropdowns
- **Side Filter**: Buy, Sell dropdowns
- **Refresh Button**: Manual data reload
- **Loading States**: Spinner during fetch
- **Empty State**: Message when no trades found

**Data Displayed Per Trade**:
- Symbol
- Side (Buy/Sell badge with color coding)
- Quantity
- Price
- P&L (color-coded: green for profit, red for loss)
- Opened timestamp
- Closed timestamp (or "Open" if still active)

**Color Coding**:
- Profitable trades: `text-emerald-400`
- Losing trades: `text-red-400`
- Breakeven/unknown: `text-slate-400`
- Buy badge: `bg-emerald-500/20 text-emerald-400`
- Sell badge: `bg-red-500/20 text-red-400`

### Dashboard Trades Page (`app/dashboard/trades/page.tsx`)

**File Path**: `Trade-Journal/frontend/app/dashboard/trades/page.tsx`

**Purpose**: Paginated trade list optimized for dashboard view

**Key Differences from `/trades`**:
- Server-side pagination (more scalable)
- Query parameter-based filters (`?symbol=AAPL&asset=equity`)
- Integrated with dashboard layout (AppShell)
- URL state persistence (filters survive page refresh)

**Pagination**:
- `page`: Current page number
- `limit`: Items per page (default 100, max 100)
- URL updates: `?page=2&limit=50`

**Filters**:
- `symbol`: Symbol search (server-side `ILIKE`)
- `asset`: Asset type (equity, option, futures, crypto)
- `from`: Date range start (ISO format)
- `to`: Date range end (ISO format)

### Trade Details Drawer (`components/trades/TradeDetailsDrawer.tsx`)

**File Path**: `Trade-Journal/frontend/components/trades/TradeDetailsDrawer.tsx`

**Purpose**: Slide-out drawer showing detailed trade information

**Information Displayed** (typical):
- Full trade details (symbol, quantity, prices)
- P&L breakdown (realized, unrealized if position still open)
- Fees and commission
- Entry and exit timestamps
- Trade tags (e.g., "swing", "momentum", "earnings play")
- Trade notes (user-added context, lessons learned)
- Screenshots or charts (if implemented)
- Multi-leg details (for options spreads)

**Interactions**:
- Edit trade details
- Add/remove tags (TODO: Persist tags via API)
- Add/edit notes (TODO: Persist note via API)
- Delete trade (with confirmation)
- Close drawer

**Known TODOs**:
- `// TODO: Persist tags via API` - Tags are displayed but not saved
- `// TODO: Persist note via API` - Notes are displayed but not saved

### Virtualized Trades Table (`src/components/trades/VirtualizedTradesTable.tsx`)

**File Path**: `Trade-Journal/frontend/src/components/trades/VirtualizedTradesTable.tsx`

**Purpose**: High-performance trade table using virtualization for large datasets (1000+ rows)

**Technology**:
- Uses `react-window` or `@tanstack/react-virtual`
- Only renders visible rows (dramatically reduces DOM nodes)
- Smooth scrolling with imperceptible lag
- Handles 10,000+ trades without performance degradation

**When Used**:
- When user has > 200 trades (automatic fallback to virtualization)
- When performance is critical (analytics pages, exports)

**Features**:
- All standard filters and sorting
- Preserves full functionality of non-virtualized table
- Progressive enhancement (works even if virtualization fails)

### Add Trade Form (`app/add-trade/page.tsx`)

**File Path**: `Trade-Journal/frontend/app/add-trade/page.tsx`

**Purpose**: Manual trade entry form

**Fields**:
- **Symbol** (required): Ticker symbol (e.g., AAPL, TSLA)
- **Asset Type**: Equity, Option, Futures, Crypto
- **Side**: Buy or Sell
- **Quantity** (required): Number of shares/contracts
- **Entry Price** (required): Price at which position was opened
- **Exit Price** (optional): Price at which position was closed (blank if still open)
- **Entry Date** (required): When position was opened
- **Exit Date** (optional): When position was closed
- **Fees**: Broker fees and commissions
- **Notes**: Optional trade notes
- **Tags**: Optional trade tags (strategy, setup type, etc.)

**Validation**:
- Symbol: Required, alphanumeric
- Quantity: Required, positive number
- Entry Price: Required, positive number
- Exit Price: Optional, positive number if provided
- Dates: Valid date format, exit date must be after entry date if both provided

**Behavior**:
- On submit: POST to `/api/trades`
- On success: Redirect to `/trades` with success toast
- On error: Show error message inline

---

## 3. State & Data Fetching

### useUserTrades Hook (`components/trades/useUserTrades.ts`)

**File Path**: `Trade-Journal/frontend/components/trades/useUserTrades.ts`

**Purpose**: SWR-based hook for fetching trades with caching and auto-revalidation

**Implementation**:
```typescript
export function useUserTrades(opts?: { 
  filters?: Filters; 
  refreshInterval?: number 
}) {
  const { user, loading: authLoading } = useAuth()
  const filters = opts?.filters ?? {}
  
  // SWR key includes user ID and filters for cache isolation
  const key = !authLoading && user 
    ? ["user-trades", user.id, JSON.stringify(filters)] 
    : null

  const fetcher = async (_, userId, filtersJson) => {
    const supabase = createSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    const params = new URLSearchParams()
    if (filters.instrument_type) params.set('asset', filters.instrument_type)
    if (filters.symbol) params.set('symbol', filters.symbol)
    params.set('limit', '100')
    params.set('offset', '0')

    const response = await fetch(`/api/trades?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    return data.items || []
  }

  const swr = useSWR(key, fetcher, {
    refreshInterval: opts?.refreshInterval ?? 0,
    revalidateOnFocus: true,
  })

  return { ...swr, authLoading }
}
```

**Features**:
- **Caching**: Trades cached per user + filter combination
- **Auto-Revalidation**: Re-fetches on window focus (user switches back to tab)
- **Optional Polling**: `refreshInterval` for live updates (default: off)
- **Filter Support**: Symbol, instrument type, status

**Usage**:
```typescript
function MyTradesComponent() {
  const { data: trades, error, mutate } = useUserTrades({
    filters: { symbol: 'AAPL' },
    refreshInterval: 30000 // Poll every 30 seconds
  })
  
  if (!trades) return <LoadingSpinner />
  return <TradeTable trades={trades} onRefresh={mutate} />
}
```

### useTrades Hook (`hooks/useTrades.ts`)

**File Path**: `Trade-Journal/frontend/hooks/useTrades.ts`

**Purpose**: React Query-based hook for trades (alternative to SWR)

**Why Two Hooks?**
- **Legacy**: `useUserTrades` uses SWR (older codebase)
- **Modern**: `useTrades` uses React Query (newer codebase)
- **Recommendation**: Standardize on React Query long-term

**React Query Advantages**:
- Better devtools (React Query Devtools)
- More flexible caching strategies
- Built-in mutation support
- Better TypeScript support

---

## 4. API Routes

### GET `/api/trades` - Fetch Trades

**File Path**: `Trade-Journal/frontend/app/api/trades/route.ts`

**Method**: `GET`

**Authentication**: Required (Bearer token in `Authorization` header)

**Query Parameters**:
- `page` (number, default: 1): Page number for pagination
- `limit` (number, default: 50, max: 100): Items per page
- `sort` (string, default: 'opened_at'): Field to sort by
- `direction` ('asc' | 'desc', default: 'desc'): Sort direction
- `symbol` (string): Filter by symbol (case-insensitive, partial match)
- `side` (string): Filter by 'buy' or 'sell'
- `status` (string): Filter by 'open' or 'closed'
- `asset_type` (string): Filter by 'equity', 'option', 'crypto', 'futures'
- `date_from` (ISO string): Start date filter
- `date_to` (ISO string): End date filter

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": "uuid",
        "symbol": "AAPL",
        "side": "buy",
        "quantity": 100,
        "price": 150.50,
        "pnl": 1250.00,
        "opened_at": "2025-01-15T10:30:00Z",
        "closed_at": "2025-01-16T14:45:00Z",
        "status": "closed",
        "asset_type": "equity"
      }
    ],
    "totalCount": 450,
    "page": 1,
    "limit": 50,
    "totalPages": 9,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Performance Optimizations**:
- **Server-Side Filtering**: Filtering done in Supabase, not in client
- **Pagination**: Limits data transferred per request
- **Caching**: Uses `unstable_cache` with 60-second TTL
- **Selective Fields**: Only fetches necessary columns (not all trade metadata)

**Error Responses**:
- `401`: Unauthorized (no token or invalid token)
- `400`: Validation error (invalid parameters)
- `500`: Internal server error

### POST `/api/trades` - Create Trade

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "symbol": "AAPL",
  "side": "buy",
  "quantity": 100,
  "price": 150.50,
  "asset_type": "equity"
}
```

**Required Fields**:
- `symbol`: Stock ticker or symbol
- `side`: "buy" or "sell"
- `quantity`: Positive number
- `price`: Positive number

**Optional Fields**:
- `asset_type`: Defaults to 'equity' if not provided
- `fees`: Broker fees
- `notes`: User notes
- `tags`: Array of tags

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "symbol": "AAPL",
    "side": "buy",
    "quantity": 100,
    "price": 150.50,
    "status": "open",
    "opened_at": "2025-01-18T12:00:00Z",
    "user_id": "user-uuid"
  }
}
```

**Behavior**:
- Automatically sets `user_id` from authenticated user
- Sets `status` to 'open' by default
- Sets `opened_at` to current timestamp
- Invalidates trades cache (should trigger revalidateTag in production)

### PUT `/api/trades/[id]/route.ts` - Update Trade

**Method**: `PUT`

**Authentication**: Required (user can only update their own trades)

**Path Parameter**: `id` (UUID of trade)

**Request Body** (partial update):
```json
{
  "price": 151.00,
  "quantity": 110,
  "notes": "Added to position",
  "tags": ["swing", "tech"]
}
```

**Response**: Updated trade object

**RLS Enforcement**: Backend checks `user_id` matches authenticated user

### DELETE `/api/trades/[id]/route.ts` - Delete Trade

**Method**: `DELETE`

**Authentication**: Required

**Path Parameter**: `id` (UUID of trade)

**Response**:
```json
{
  "success": true,
  "message": "Trade deleted successfully"
}
```

**Behavior**:
- Soft delete (sets `deleted_at` timestamp) OR hard delete depending on implementation
- RLS enforced (user can only delete own trades)

---

## 5. Database / Supabase

### `trades` Table

**Primary Table for Trade Data**

**Key Columns**:
- `id` (UUID, PK): Unique trade ID
- `user_id` (UUID, FK to auth.users.id): Owner of the trade
- `symbol` (TEXT, NOT NULL): Ticker symbol (e.g., "AAPL", "BTC-USD")
- `instrument_type` (TEXT): Type of instrument (equity, option, futures, crypto)
- `asset_type` (TEXT): Alternative column for asset type classification
- `side` (TEXT): "buy" or "sell"
- `qty_opened` (NUMERIC): Quantity opened
- `qty_closed` (NUMERIC): Quantity closed (for partial closures)
- `avg_open_price` (NUMERIC): Average entry price
- `avg_close_price` (NUMERIC): Average exit price
- `realized_pnl` (NUMERIC): Calculated profit/loss
- `fees` (NUMERIC, DEFAULT 0): Total fees and commissions
- `commission` (NUMERIC, DEFAULT 0): Broker commission
- `opened_at` (TIMESTAMPTZ, NOT NULL): Trade open timestamp
- `closed_at` (TIMESTAMPTZ): Trade close timestamp (null if still open)
- `status` (TEXT, DEFAULT 'open'): 'open' or 'closed'
- `group_key` (TEXT): For grouping related trades (multi-leg options)
- `legs` (JSONB): Details for multi-leg trades (options spreads)
- `created_at` (TIMESTAMPTZ, DEFAULT now()): Record creation time
- `updated_at` (TIMESTAMPTZ, DEFAULT now()): Last update time
- `ingestion_run_id` (UUID, FK to import_runs.id): Link to import source
- `row_hash` (TEXT): Hash for deduplication
- `idempotency_key` (TEXT, UNIQUE per user): Prevents duplicate imports
- `broker` (TEXT): Broker name (e.g., "robinhood", "webull")
- `broker_trade_id` (TEXT): External ID from broker
- `external_id` (TEXT): Alternative external ID
- `symbol_raw` (TEXT): Original symbol from broker (before normalization)
- `meta` (JSONB): Additional metadata
- `executed_at` (TIMESTAMPTZ): Precise execution timestamp from broker
- `price` (NUMERIC): Alternative price field
- `qty` (NUMERIC): Alternative quantity field

**Indexes**:
- `user_id` (for fast user-specific queries)
- `symbol` (for symbol-based filtering)
- `opened_at` (for date range queries and sorting)
- `status` (for open/closed filtering)
- `idempotency_key` (for deduplication)

**Triggers**:
- `trigger_set_trade_row_hash`: BEFORE INSERT OR UPDATE, sets `row_hash` for deduplication
- `update_trades_updated_at`: BEFORE UPDATE, sets `updated_at` to current timestamp

**RLS Policies**:
- **SELECT**: Users can view their own trades (`auth.uid() = user_id`)
- **INSERT**: Users can insert trades with their own `user_id`
- **UPDATE**: Users can update their own trades
- **DELETE**: Users can delete their own trades

### Trade Calculations

**Realized P&L Calculation** (`lib/trade-calculations.ts`):
```typescript
export function computeRealizedPnl(trade: TradeRow): { pnl: number; pnlPct: number } {
  if (!trade.avg_close_price || !trade.qty_closed || trade.qty_closed === 0) {
    return { pnl: 0, pnlPct: 0 }
  }

  const isLong = trade.qty_opened > 0
  const priceDiff = isLong 
    ? trade.avg_close_price - trade.avg_open_price
    : trade.avg_open_price - trade.avg_close_price

  const rawPnl = priceDiff * Math.abs(trade.qty_closed)
  const fees = (trade.fees || 0) + (trade.commission || 0)
  const pnl = rawPnl - fees

  const costBasis = trade.avg_open_price * Math.abs(trade.qty_closed)
  const pnlPct = costBasis !== 0 ? (pnl / costBasis) * 100 : 0

  return { pnl, pnlPct }
}
```

**Unrealized P&L** (TODO):
- Requires real-time market data
- Calculate: `(current_price - avg_open_price) * qty_opened`
- Not yet implemented (marked as TODO in `lib/trade-calculations.ts`)

---

## 6. Edge Cases & TODOs

### Known TODOs

1. **Trade Tags Persistence**
   - **Location**: `components/trades/TradeDetailsDrawer.tsx`
   - **Comment**: `// TODO: Persist tags via API`
   - **Current**: Tags displayed in UI but not saved to database
   - **Fix**: Add `tags` JSONB column to `trades` table, update API to accept tags

2. **Trade Notes Persistence**
   - **Location**: `components/trades/TradeDetailsDrawer.tsx`
   - **Comment**: `// TODO: Persist note via API`
   - **Current**: Notes shown but not saved
   - **Fix**: Add `notes` TEXT column (if not present), update PUT endpoint

3. **Real-Time Unrealized P&L**
   - **Location**: `lib/trade-calculations.ts`
   - **Comment**: `// TODO: Implement with real-time prices`
   - **Current**: Unrealized P&L always returns 0
   - **Fix**: Integrate with market data provider (Polygon, IEX) to fetch current prices

4. **Trade Screenshots/Charts**
   - **Status**: Not implemented
   - **Need**: Upload and attach images to trades (chart screenshots, entry/exit points)
   - **Fix**: Integrate Supabase Storage, add `screenshots` JSONB array to trades table

5. **Multi-Leg Options Matching**
   - **Status**: Partially implemented
   - **Current**: `legs` JSONB field exists but not fully wired up in UI
   - **Fix**: Add UI for displaying options spreads (vertical, iron condor, etc.)

6. **Partial Position Closures**
   - **Status**: Supported in schema (`qty_closed` field) but UI doesn't handle well
   - **Issue**: If user closes 50 shares of 100-share position, UI treats as fully closed
   - **Fix**: Display remaining quantity and calculate P&L proportionally

### Edge Cases

1. **Duplicate Import Prevention**
   - **Mechanism**: `idempotency_key` (UNIQUE constraint per user)
   - **Behavior**: If same CSV row imported twice, second import is skipped
   - **Key Format**: `{broker}_{trade_id}_{symbol}_{date}` (hashed)

2. **Symbol Normalization**
   - **Issue**: Brokers use different symbol formats (e.g., "BTC-USD" vs "BTCUSD")
   - **Current**: `symbol_raw` stores original, `symbol` stores normalized
   - **Normalization Logic**: In `lib/import/adapters/*`

3. **Zero P&L Trades**
   - **Scenario**: Trade opened and closed at same price, fees wipe out gains
   - **Display**: Shows as $0.00 in neutral color
   - **Analytics**: Counted as a trade but not as win or loss

4. **Open Positions**
   - **Status**: `status = 'open'`, `closed_at = NULL`, `avg_close_price = NULL`
   - **P&L**: Realized P&L is 0 (only fees counted if any)
   - **Analytics**: Excluded from win rate calculations (not yet resolved)

5. **Split Adjustments**
   - **Issue**: Stock splits (e.g., 2:1) change quantities and prices
   - **Current**: Import system handles split-adjusted data if broker provides it
   - **UI**: "Split-aware display adjustments" mentioned in README but details unclear

6. **Timezone Handling**
   - **Trade Timestamps**: Stored in UTC (`opened_at`, `closed_at`)
   - **Display**: Converted to user's local timezone in UI
   - **Broker Data**: May come in EST (US market hours) → normalized to UTC

7. **Large Datasets**
   - **Performance**: Virtualization kicks in at 200+ trades
   - **Pagination**: Backend caps at 100 items per page
   - **Caching**: 60-second cache on trades API

8. **Concurrent Updates**
   - **Scenario**: User edits trade in one tab, syncs broker data in another
   - **Behavior**: Last write wins (no optimistic locking)
   - **Mitigation**: `updated_at` timestamp can detect conflicts (not enforced)

---

## 7. Integration with Other Features

### Import System
- **Connection**: `trades.ingestion_run_id` links to `import_runs.id`
- **Workflow**: CSV import → creates `import_runs` record → inserts trades with `ingestion_run_id`
- **Rollback**: If import fails, trades can be deleted by `ingestion_run_id`

### Analytics
- **Dependency**: All analytics calculations (win rate, P&L, Sharpe ratio) source from `trades` table
- **Real-Time**: Analytics pages fetch trades and compute metrics client-side (for small datasets)
- **Aggregated**: For large datasets, analytics should use pre-computed metrics (not yet implemented)

### Calendar View
- **Connection**: Calendar page fetches trades and groups by `opened_at` date
- **Display**: Daily P&L heatmap showing aggregate P&L per day
- **Drill-Down**: Clicking a date shows trades for that day

### Broker Connections (SnapTrade)
- **Auto-Sync**: Trades synced from broker via SnapTrade are marked with `broker` field
- **Verification**: Broker-synced trades count toward "Broker-Verified" badge
- **Conflict**: If user manually adds a trade that also syncs from broker, `idempotency_key` prevents duplicate

### Subscription Tiers
- **Free Tier**: May have trade count limit (e.g., 100 trades per month)
- **Pro Tier**: Unlimited trades
- **Enforcement**: Not visible in current code, but `user_role` in profiles table suggests future limitation

---

## 8. Performance Optimizations

### Virtualization
- **Library**: `react-window`, `@tanstack/react-virtual`, or `react-virtuoso`
- **Trigger**: Automatically used when trade count > 200
- **Benefit**: Renders only visible rows (e.g., 20 out of 10,000)
- **Impact**: Smooth scrolling even with 50,000+ trades

### Server-Side Operations
- **Filtering**: Done in Supabase query, not client-side array filter
- **Sorting**: Database `ORDER BY`, not JavaScript sort
- **Pagination**: Only fetch needed page, not all data then slice

### Caching Strategy
- **SWR/React Query**: Client-side cache with stale-while-revalidate
- **Next.js Cache**: `unstable_cache` with 60-second TTL for API routes
- **Invalidation**: On trade create/update/delete, cache is invalidated

### Selective Queries
- **Minimal Fields**: API only fetches displayed columns, not full trade metadata
- **Example**: Fetches `id, symbol, side, quantity, price, pnl, opened_at, closed_at, status, asset_type`
- **Benefit**: Reduces payload size by 50-70%

---

## 9. Testing Considerations

### Unit Tests
- **P&L Calculations**: Test `computeRealizedPnl` with various scenarios (long/short, fees, partial closures)
- **Filters**: Test client-side filtering logic (symbol search, asset type, side)
- **Formatters**: Test currency and date formatting functions

### Integration Tests
- **API Routes**: Test GET/POST/PUT/DELETE endpoints with various parameters
- **Auth**: Test RLS enforcement (user can't access other users' trades)
- **Pagination**: Test edge cases (page 0, page beyond max, negative limit)

### E2E Tests
- **Trade Creation Flow**: Login → Navigate to add trade → Fill form → Submit → Verify in list
- **Filtering**: Apply filters → Verify correct trades shown → Clear filters → Verify all shown
- **Import-to-Display**: Import CSV → Verify trades appear in list with correct data

### Performance Tests
- **Large Datasets**: Seed database with 10,000 trades → Measure list load time (should be < 2 seconds)
- **Virtualization**: Verify smooth scrolling with large datasets
- **API Response Time**: GET `/api/trades` should respond in < 500ms with 100 trades

---

**End of Document**

