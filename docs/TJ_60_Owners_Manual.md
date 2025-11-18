# Trade-Journal Owner's Manual

**Document Version**: 1.0  
**Last Updated**: 2025-01-18  
**Audience**: Non-technical owner/stakeholder

---

## What Is This Application?

**Trade-Journal** (also branded as "RiskR" or "ProfitPad" in marketing) is a **comprehensive trading analytics platform** for retail traders. It helps traders track their trades, analyze performance, and improve their trading strategies.

---

## What Can Users Do Today?

### 1. Account Management

**Sign Up & Login**:
- Create account with email/password
- Log in to existing account
- Reset forgotten password
- (TODO: Google OAuth login)

**Profile**:
- Set username, full name, avatar
- View account creation date
- See subscription status

**Status**: ✅ **Fully Implemented**

---

### 2. Trade Journaling

**View Trades**:
- See list of all trades (paginated, sortable, filterable)
- Filter by symbol, asset type (stocks/options/crypto), side (buy/sell), date range
- Search by symbol name
- View details: symbol, quantity, entry/exit prices, P&L, fees, timestamps

**Add Trades**:
- Manually enter trades via form
- Import trades from CSV files (multiple broker formats supported)
- Connect broker accounts for automatic import (via SnapTrade)

**Trade Details**:
- View individual trade information
- (PARTIAL: Notes and tags displayed but not persisting to database)

**Status**: ✅ **Mostly Complete** (Notes/tags persistence TODO)

---

### 3. Data Import

**CSV Import**:
- Upload CSV files from brokers (Interactive Brokers, Robinhood, Webull, TD Ameritrade, E*TRADE, Schwab, Fidelity, others)
- Automatic broker detection (90%+ accuracy)
- Field mapping with presets
- Data preview before import
- Duplicate detection (prevents re-importing same trades)
- Import summary (inserted, skipped, errors)

**Broker Connection** (SnapTrade):
- Connect brokerage accounts securely (OAuth)
- Auto-sync holdings, balances, orders, activities
- Earn "Broker-Verified" badge (visible site-wide)
- Manual refresh or automatic daily sync
- Disconnect broker anytime

**Status**: ✅ **Fully Implemented**

---

### 4. Analytics & Performance

**Metrics Displayed**:
- Total P&L (profit/loss)
- Win rate (% of profitable trades)
- Average win vs. average loss
- Profit factor (gross profit ÷ gross loss)
- Sharpe ratio (risk-adjusted returns)
- Max drawdown (largest peak-to-trough decline)
- Total trade count
- Monthly returns (P&L by month)
- Performance by symbol (best/worst performers)

**Visualizations**:
- Equity curve (cumulative P&L over time)
- P&L by month (bar chart)
- Calendar heatmap (daily P&L color-coded)
- Drawdown chart
- Performance comparison vs. benchmark (SPY, QQQ, etc.)

**Data Sources**:
- Combined view: Manual trades + broker data
- Filter by: Manual only, broker only, or combined
- Timeframe filters: 1W, 1M, 3M, YTD, 1Y, All Time

**Status**: 🟡 **Partially Complete**
- **Working**: All metrics display, filters work, charts render
- **TODO**: Some calculations are placeholders (e.g., Sharpe ratio always 0)
- **TODO**: Equity curve calculation not fully accurate

---

### 5. Calendar View

**What It Shows**:
- Calendar grid (monthly or weekly view)
- Each day color-coded by P&L (green = profit, red = loss)
- Hover shows trades for that day
- Summary stats: winning days, losing days, average daily P&L

**Status**: ✅ **Fully Implemented**

---

### 6. Options Tools

**Options Calculator**:
- Black-Scholes pricing model
- Calculate Greeks: Delta, Gamma, Theta, Vega, Rho
- Scenario analysis (adjust strike, DTE, IV)
- American option approximation

**Status**: ✅ **Implemented** (client-side calculations)

---

### 7. Market Tools

**Market Scanner**:
- Preset filters: Gappers, high volume, high IV rank, unusual options activity
- Search for symbols
- View trending tickers
- (PARTIAL: Scanner infrastructure exists, some presets not fully wired)

**Real-Time Quotes**:
- Get current price for any symbol
- Symbol search autocomplete
- (Requires Polygon.io API key)

**Status**: 🟡 **Partially Implemented**

---

### 8. Subscriptions & Billing

**Plans**:
- **Free/Starter**: Basic features, limited trade count (TODO: enforce limit)
- **Professional**: Unlimited trades, advanced analytics, priority support
- **Enterprise**: Team features, dedicated support, white-label options

**Billing**:
- Stripe integration for payments
- Upgrade/downgrade anytime
- Customer portal for managing payment methods, viewing invoices
- 14-day free trial (TODO: verify if active)

**Status**: ✅ **Implemented** (Stripe webhooks handle subscription updates)

---

### 9. Settings

**Profile Settings**:
- Update username, full name, avatar
- Email is read-only (set during signup)

**Security Settings**:
- Change password
- (TODO: 2FA/MFA)

**Data Management**:
- Export all data (TODO: implement CSV export)
- Delete account (with confirmation, cascades to all user data)

**Status**: 🟡 **Partially Implemented**

---

## What's Incomplete or Stubbed?

### High Priority TODOs

1. **Trade Notes & Tags Persistence**
   - **Current**: Notes and tags show in UI but don't save to database
   - **Fix**: Wire up API endpoints to persist to `trades` table

2. **Equity Curve Accuracy**
   - **Current**: Equity curve shows placeholder data in some cases
   - **Fix**: Proper cumulative P&L calculation from trades

3. **Sharpe Ratio Calculation**
   - **Current**: Always returns 0
   - **Fix**: Implement proper risk-free rate and volatility calculation

4. **Unrealized P&L**
   - **Current**: Always 0 (only realized P&L calculated)
   - **Fix**: Integrate real-time market data to calculate current position value

5. **Import Rollback UI**
   - **Current**: Database supports rollback, but no UI button
   - **Fix**: Add "Undo Import" button in import history

6. **Trade Screenshot Uploads**
   - **Current**: Not implemented
   - **Fix**: Add Supabase Storage integration for image uploads

7. **Email Import**
   - **Current**: Infrastructure partially built, not wired up
   - **Fix**: Parse trade confirmations from broker emails

8. **Google OAuth**
   - **Current**: Button exists but shows placeholder toast
   - **Fix**: Integrate Supabase Google OAuth provider

9. **Market Scanner Presets**
   - **Current**: Some presets don't return data
   - **Fix**: Complete scanner API logic for all presets

10. **CSV Export**
    - **Current**: "Export" button exists but doesn't trigger download
    - **Fix**: Generate and download CSV of user's trades

### Medium Priority TODOs

11. **Multi-Leg Options UI**
    - **Current**: Database stores options spreads (`legs` JSONB), but UI doesn't display
    - **Fix**: Add UI for visualizing spreads (verticals, iron condors, etc.)

12. **Partial Position Closures**
    - **Current**: Database supports (`qty_closed` field), but UI treats all trades as fully closed
    - **Fix**: Show remaining quantity and proportional P&L

13. **Real-Time Import Progress**
    - **Current**: Import blocks until complete (no progress bar)
    - **Fix**: WebSocket or SSE for real-time progress updates

14. **Custom Import Presets**
    - **Current**: Users can map fields manually, but can't save as preset
    - **Fix**: Add "Save as Preset" button, store in `import_mapping_presets` table

15. **Trade Count Limits (Free Tier)**
    - **Current**: Free tier mentioned in plans, but limit not enforced
    - **Fix**: Add middleware to check trade count before insert

---

## Technical Notes for Future Development

### Architecture Strengths

1. **Bulletproof Import System**: Idempotency via hash-based deduplication prevents duplicate imports
2. **Broker Integration**: SnapTrade OAuth handles broker connections securely
3. **RLS Enforcement**: All database queries automatically filtered by user_id (security built-in)
4. **Scalable Trade List**: Virtualization handles 10,000+ trades without lag
5. **Server-Side Filtering**: Database does heavy lifting (pagination, sorting), not client

### Technical Debt

1. **Dual State Management**: Both React Query and SWR used (should standardize on React Query)
2. **Ignored Build Errors**: `next.config.js` ignores TypeScript/ESLint errors (⚠️ HIGH RISK)
3. **Debug Routes in Production**: Many `/api/test-*` and `/api/debug-*` endpoints (should be gated or removed)
4. **Multiple Import Variants**: `/api/import/csv-webull*` has many versions (consolidate)
5. **Hardcoded Placeholders**: Some analytics calculations return dummy data (e.g., Sharpe ratio = 0)

### Performance Considerations

- **Large Datasets**: Virtualization + server-side pagination handle 50,000+ trades efficiently
- **Real-Time Data**: Polygon.io API provides quotes, but requires API key and has rate limits
- **Caching**: 60-second cache on trades API (via `unstable_cache`)
- **Database Indexes**: Trades table indexed on `user_id`, `symbol`, `opened_at`, `status`

### Security Notes

- **Secrets Management**: Service role key never exposed to client (validated in build scripts)
- **RLS**: All tables have Row Level Security policies (user can only access own data)
- **Auth**: Supabase Auth with JWT tokens, HTTP-only cookies
- **SnapTrade**: OAuth flow, credentials stored server-side only

### Deployment

- **Platform**: Vercel (implied by `vercel.json` config)
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Market Data**: Polygon.io (requires API key)
- **Error Tracking**: Sentry (optional, via `SENTRY_DSN` env var)

---

## Summary: What Works vs. What's Unfinished

### ✅ Fully Working (Ready for Users)

- User authentication (signup, login, password reset)
- Trade list (view, filter, sort, search)
- Manual trade entry
- CSV import (all major brokers)
- Broker connections (SnapTrade)
- Basic analytics (P&L, win rate, trade count)
- Calendar view (daily P&L heatmap)
- Options calculator (Black-Scholes)
- Subscription management (Stripe)
- Profile settings

### 🟡 Partially Working (Needs Completion)

- Trade notes/tags (UI exists, not persisting)
- Advanced analytics (some calculations stubbed)
- Market scanner (some presets incomplete)
- Data export (button exists, not implemented)
- Settings (some actions TODO)

### ❌ Not Started / Placeholder Only

- Email import
- Google OAuth
- 2FA/MFA
- Trade screenshots
- Multi-leg options UI
- Real-time import progress
- Custom import presets
- Free tier trade limits

---

## Recommendations for Next Steps

1. **Fix Build Errors**: Remove `ignoreBuildErrors` and `ignoreDuringBuilds` from `next.config.js`, fix errors
2. **Complete High-Priority TODOs**: Notes/tags persistence, Sharpe ratio, unrealized P&L
3. **Remove/Gate Debug Routes**: Clean up `test-*` and `debug-*` API endpoints
4. **Consolidate Import Variants**: Merge `/csv-webull*` variants into main `/csv` endpoint
5. **Standardize State Management**: Migrate all SWR usage to React Query
6. **Add E2E Tests**: Playwright tests for critical user flows (signup → import → view trades)
7. **Implement Trade Limits**: Enforce free tier limits (e.g., 100 trades/month)
8. **Complete Export**: Implement CSV export for trades

---

**End of Document**

