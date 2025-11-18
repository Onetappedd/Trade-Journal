# Trade-Journal Feature Deep Dive: Analytics

**Document Version**: 1.0  
**Last Updated**: 2025-01-18  
**Feature**: Performance Analytics & Metrics

---

## Overview

**What Users See**: Comprehensive analytics dashboard showing P&L, win rate, Sharpe ratio, drawdown, equity curve, monthly returns, and performance by symbol.

**Where**: `/analytics`, `/dashboard/analytics`

**Data Sources**: `trades` table, aggregated via `/api/analytics/combined` endpoint

---

## Key Metrics Displayed

- **Total P&L**: Realized + Unrealized profit/loss
- **Win Rate**: % of profitable trades
- **Average Win/Loss**: Mean P&L of winning vs losing trades
- **Profit Factor**: Gross profit / gross loss
- **Sharpe Ratio**: Risk-adjusted returns (TODO: proper calculation)
- **Max Drawdown**: Largest peak-to-trough decline
- **Total Trades**: Count of all trades
- **Monthly Returns**: P&L breakdown by month
- **Performance by Symbol**: Top/bottom performers

---

## API Endpoints

### GET `/api/analytics/combined`

**Query Parameters**:
- `source`: 'combined' | 'manual' | 'broker' (data source filter)
- `timeframe`: '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL'

**Response**: Aggregated analytics metrics (see analytics/page.tsx for structure)

**Data Aggregation**:
- Manual trades: from `trades` table
- Broker data: from `snaptrade_accounts` (holdings, balances)
- Combined: Merges both sources

---

## Charts & Visualizations

- **Equity Curve**: Line chart of cumulative P&L over time
- **P&L by Month**: Bar chart of monthly returns
- **Drawdown Chart**: Shows peak-to-trough declines
- **Performance by Symbol**: Sorted by P&L
- **Win Rate Chart**: Visual representation of win/loss ratio

---

## Known TODOs

1. **Equity Curve Calculation**: Marked as `TODO: Calculate from trades` in multiple places
2. **Proper Sharpe Ratio**: Currently hardcoded to 0
3. **Drawdown Series**: Function not yet implemented in database
4. **P&L by Tag**: Database function missing
5. **Expectancy by Bucket**: Analytics function incomplete

See `docs/RISKR_50_Known_Gaps_And_Todos.md` for full list.

---

**End of Document**

