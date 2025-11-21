# Trade-Journal Feature Deep Dive: Monte Carlo Future Wealth Simulator

**Document Version**: 1.0  
**Last Updated**: 2025-01-30  
**Feature**: Trade-Level Monte Carlo Simulation for Future Wealth Projection

---

## Overview

**What Users See**: A Monte Carlo simulator on the Analytics page that projects future wealth based on historical trade performance. Shows a "cone of uncertainty" chart with percentile bands and sample paths, plus key summary metrics.

**Where**: `/analytics` page, integrated as a collapsible card component

**Data Sources**: User's closed trades from the `trades` table, analyzed via `/api/analytics/monte-carlo-trades` endpoint

---

## R-Multiple Definition

Since the `trades` table does not have an explicit `risk_amount` field, we approximate R-multiples as:

```
R = realized_pnl / avg_abs_loss
```

Where `avg_abs_loss` is the average absolute value of losing trades. This ensures:
- **Winners** have positive R (e.g., +0.8R, +2.3R)
- **Losers** have negative R (e.g., -1.0R, -1.8R)
- R represents how many "risk units" the trade made/lost

**Fallback**: If there are no losing trades, we use 10% of the average absolute trade size as the risk unit.

---

## Simulation Modes

### 1. Bootstrap Mode (Default: "Use My Stats")

**How it works**:
- Fetches the user's last 100 closed trades
- Calculates R-multiples for each trade
- Resamples (with replacement) from these historical R-values
- For each simulated trade:
  - Samples a random historical R
  - Calculates `riskAmount = equity * (riskPct / 100)`
  - Calculates `pnl = R * riskAmount`
  - Updates equity: `equity = max(0, equity + pnl)`

**Use case**: Best for users with at least 20 completed trades who want to see projections based on their actual performance patterns.

### 2. Parametric Mode ("What If?")

**How it works**:
- Uses user-provided parameters:
  - Win Rate (0-100%)
  - Avg Win R (positive number)
  - Avg Loss R (negative number)
- For each simulated trade:
  - Draws win/loss based on win rate (Bernoulli)
  - Uses avgWinR or avgLossR (with ±10% random noise)
  - Same equity update logic as bootstrap mode

**Use case**: Best for scenario planning, testing different assumptions, or users with insufficient trade history.

---

## API Endpoint

### POST `/api/analytics/monte-carlo-trades`

**Authentication**: Required (Bearer token)

**Request Body**:
```typescript
{
  mode: 'profileDefaults' | 'parametric';
  numTrades?: number;      // default: 500
  iterations?: number;     // default: 1000
  riskPct?: number;        // default: 1 (1% of equity per trade)
  startEquity?: number;    // default: 10000
  // For parametric mode only:
  winRate?: number;        // 0-1 or 0-100 (normalized to 0-1)
  avgWinR?: number;        // required for parametric
  avgLossR?: number;       // required for parametric (must be negative)
}
```

**Response**:
```typescript
{
  success: true;
  result: {
    summary: Array<{
      tradeIndex: number;
      p10: number;  // 10th percentile equity
      p25: number;  // 25th percentile equity
      p50: number;  // 50th percentile (median)
      p75: number;  // 75th percentile equity
      p90: number;  // 90th percentile equity
    }>;
    samplePaths: Array<Array<{
      tradeIndex: number;
      equity: number;
    }>>;  // 3 random paths for visualization
    ruinProbability: number;  // 0-1, fraction that hit ruin threshold
    endEquityDistribution: number[];  // Final equity for all iterations
  };
  stats: {
    mode: string;
    numTrades: number;
    iterations: number;
    riskPct: number;
    startEquity: number;
    // For profileDefaults mode:
    sampleSize?: number;
    winRate?: number;
    avgWinR?: number;
    avgLossR?: number;
    avgAbsLoss?: number;
    // For parametric mode:
    winRate?: number;
    avgWinR?: number;
    avgLossR?: number;
  };
}
```

**Error Responses**:
- `422`: Insufficient data (less than 20 trades for bootstrap mode)
- `400`: Invalid parameters
- `401`: Unauthorized
- `500`: Simulation error

---

## Key Metrics Explained

### Most Likely Balance (Median Final Equity)
- **What it means**: The 50th percentile final equity value
- **Interpretation**: "In 50% of simulations, you ended with at least this amount"
- **Calculation**: `p50` from the final trade index in the summary

### Unlucky Scenario (10th Percentile Final Equity)
- **What it means**: The 10th percentile final equity value
- **Interpretation**: "In 10% of simulations, you did worse than this"
- **Calculation**: `p10` from the final trade index in the summary

### Risk of Ruin
- **What it means**: Probability of hitting the ruin threshold (50% drawdown from starting equity)
- **Interpretation**: "Chance of blowing up (hitting 0 or -50% drawdown)"
- **Calculation**: `ruinProbability = ruinedCount / iterations`

### Profitable Paths
- **What it means**: Percentage of simulation paths that ended above starting equity
- **Interpretation**: "X% of paths ended profitable"
- **Calculation**: `(paths ending > startEquity) / totalPaths * 100`

---

## Chart Visualization

The simulator displays a "cone of uncertainty" chart using Recharts:

- **X-axis**: Trade number (0 to numTrades)
- **Y-axis**: Equity (dollars)
- **Visual elements**:
  - Light green fill: 10th-90th percentile band
  - Darker green fill: 25th-75th percentile band
  - Bold green line: Median (50th percentile)
  - Thin dashed gray lines: 3 sample paths showing actual path jaggedness

---

## Implementation Files

### Backend
- `lib/analytics/tradeStats.ts`: R-multiple calculation and trade statistics
- `lib/analytics/monteCarloTrades.ts`: Monte Carlo simulation engine (bootstrap & parametric)
- `app/api/analytics/monte-carlo-trades/route.ts`: API endpoint

### Frontend
- `components/analytics/MonteCarloSimulator.tsx`: Main UI component
- `app/analytics/page.tsx`: Integration point (imports and renders component)

---

## Edge Cases Handled

1. **Insufficient trades** (< 20): Returns 422 with friendly message
2. **No losing trades**: Uses fallback risk unit (10% of avg trade size)
3. **Zero equity**: Equity never goes below 0 (ruin = hitting threshold, not necessarily 0)
4. **Invalid parameters**: Validates ranges (numTrades: 1-10000, iterations: 10-10000, riskPct: 0.1-10)
5. **Win rate normalization**: Accepts both 0-1 and 0-100, normalizes to 0-1

---

## Performance Considerations

- **Iterations**: Default 1000 provides good balance between accuracy and speed
- **Num Trades**: Default 500 is reasonable for most use cases
- **Chart rendering**: Only renders percentile bands and 3 sample paths (not all 1000 paths)
- **Client-side simulation**: Runs on server (API route) to avoid blocking UI

---

## Future Enhancements

Potential improvements:
1. Add more ruin thresholds (e.g., 25%, 75%)
2. Support different risk management strategies (fixed dollar, Kelly criterion)
3. Add time-based projections (e.g., "if I trade X trades per month, where will I be in 1 year?")
4. Export simulation results to CSV/PDF
5. Compare multiple scenarios side-by-side
6. Add confidence intervals for key metrics

---

**End of Document**

