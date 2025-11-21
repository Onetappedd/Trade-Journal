/**
 * Monte Carlo Simulation Engine for Trade-Level Future Wealth
 * 
 * Implements two modes:
 * 1. Bootstrap mode: Resamples from historical R-multiples
 * 2. Parametric mode: Uses win rate + avg win R + avg loss R
 */

export interface MonteCarloSummaryPoint {
  tradeIndex: number;  // 0..numTrades
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface MonteCarloPathPoint {
  tradeIndex: number;
  equity: number;
}

export interface MonteCarloResult {
  summary: MonteCarloSummaryPoint[];
  samplePaths: MonteCarloPathPoint[][]; // e.g., 3 random paths
  ruinProbability: number;        // fraction of iterations that hit ruin threshold
  endEquityDistribution: number[]; // final equity values for histogram if needed
  p95FinalEquity?: number; // 95th percentile final equity (for Y-axis scaling)
}

export interface BootstrapParams {
  rValues: Array<{ r: number }>; // Historical R-multiples
  startEquity: number;
  riskPct: number;  // Risk per trade as % of equity (e.g., 1 = 1%)
  numTrades: number;
  iterations: number;
  ruinThreshold?: number; // Equity threshold for "ruin" (default: 0)
  maxRiskCap?: number; // Maximum risk amount per trade (liquidity ceiling)
  maxRCap?: number; // Maximum R-multiple to use (Winsorization, e.g., 95th percentile)
}

export interface ParametricParams {
  winRate: number;      // 0-1
  avgWinR: number;
  avgLossR: number;     // negative
  startEquity: number;
  riskPct: number;
  numTrades: number;
  iterations: number;
  ruinThreshold?: number;
  maxRiskCap?: number; // Maximum risk amount per trade (liquidity ceiling)
  maxRCap?: number; // Maximum R-multiple to use (Winsorization)
}

/**
 * Bootstrap mode: Resample from historical R-multiples
 */
export function runBootstrapSimulation(params: BootstrapParams): MonteCarloResult {
  const {
    rValues,
    startEquity,
    riskPct,
    numTrades,
    iterations,
    ruinThreshold = 0,
    maxRiskCap = 5000, // Default: $5,000 max risk per trade (liquidity ceiling)
    maxRCap, // Optional: cap R-values at percentile (Winsorization)
  } = params;

  if (rValues.length === 0) {
    throw new Error('Cannot run bootstrap simulation with no R-values');
  }

  // Winsorization: Cap R-values at 95th percentile if maxRCap not provided
  let cappedRValues = rValues.map(rv => rv.r);
  if (maxRCap === undefined) {
    // Calculate 95th percentile of R-values
    const sortedR = [...cappedRValues].sort((a, b) => a - b);
    const p95Index = Math.ceil(0.95 * sortedR.length) - 1;
    const p95R = sortedR[Math.max(0, p95Index)];
    // Cap at 95th percentile or 5R, whichever is higher (but reasonable)
    const effectiveCap = Math.max(p95R, 5); // At least 5R cap
    cappedRValues = cappedRValues.map(r => Math.min(r, effectiveCap));
  } else {
    cappedRValues = cappedRValues.map(r => Math.min(r, maxRCap));
  }

  // Store equity paths for all iterations
  const allPaths: number[][] = [];
  const finalEquities: number[] = [];
  let ruinedCount = 0;

  // Run iterations
  for (let iter = 0; iter < iterations; iter++) {
    let equity = startEquity;
    const path: number[] = [equity];
    let ruined = false;
    let stoppedTrading = false; // Bankruptcy barrier

    // Simulate each trade
    for (let t = 0; t < numTrades; t++) {
      // Bankruptcy barrier: If equity is too low, stop trading
      if (equity <= 100) { // $100 threshold (broker would liquidate)
        stoppedTrading = true;
        // Keep equity at current level (don't allow recovery)
        path.push(equity);
        continue;
      }

      // Sample a random R from capped historical data
      const randomIndex = Math.floor(Math.random() * cappedRValues.length);
      const sampledR = cappedRValues[randomIndex];

      // Calculate risk amount with liquidity ceiling
      // ActualRisk = min(Equity * RiskPercent, MaxRiskCap)
      const calculatedRisk = equity * (riskPct / 100);
      const actualRisk = Math.min(calculatedRisk, maxRiskCap);

      // Calculate P&L: R * actualRisk
      const pnl = sampledR * actualRisk;

      // Update equity (never go below 0)
      equity = Math.max(0, equity + pnl);

      // Check for ruin
      if (!ruined && equity <= ruinThreshold) {
        ruined = true;
        ruinedCount++;
      }

      path.push(equity);
    }

    allPaths.push(path);
    finalEquities.push(equity);
  }

  // Compute percentile bands per trade index
  const summary: MonteCarloSummaryPoint[] = [];
  
  for (let t = 0; t <= numTrades; t++) {
    const equitiesAtT = allPaths.map(path => path[t]);
    equitiesAtT.sort((a, b) => a - b);

    summary.push({
      tradeIndex: t,
      p10: getPercentile(equitiesAtT, 10),
      p25: getPercentile(equitiesAtT, 25),
      p50: getPercentile(equitiesAtT, 50),
      p75: getPercentile(equitiesAtT, 75),
      p90: getPercentile(equitiesAtT, 90),
    });
  }

  // Return ALL paths for visualization (will be rendered with low opacity)
  const allPathsFormatted: MonteCarloPathPoint[][] = [];
  
  for (let idx = 0; idx < allPaths.length; idx++) {
    const path = allPaths[idx].map((equity, tradeIndex) => ({
      tradeIndex,
      equity,
    }));
    allPathsFormatted.push(path);
  }

  // Calculate 95th percentile of final equity for Y-axis scaling
  const sortedFinalEquities = [...finalEquities].sort((a, b) => a - b);
  const p95Index = Math.ceil(0.95 * sortedFinalEquities.length) - 1;
  const p95FinalEquity = sortedFinalEquities[Math.max(0, p95Index)];

  return {
    summary,
    samplePaths: allPathsFormatted, // Now contains all paths, not just 3
    ruinProbability: ruinedCount / iterations,
    endEquityDistribution: finalEquities,
    p95FinalEquity,
  };
}

/**
 * Parametric mode: Use win rate + avg win R + avg loss R
 */
export function runParametricSimulation(params: ParametricParams): MonteCarloResult {
  const {
    winRate,
    avgWinR,
    avgLossR,
    startEquity,
    riskPct,
    numTrades,
    iterations,
    ruinThreshold = 0,
    maxRiskCap = 5000, // Default: $5,000 max risk per trade (liquidity ceiling)
    maxRCap = 5, // Default: Cap R at 5R for parametric mode
  } = params;

  // Store equity paths for all iterations
  const allPaths: number[][] = [];
  const finalEquities: number[] = [];
  let ruinedCount = 0;

  // Run iterations
  for (let iter = 0; iter < iterations; iter++) {
    let equity = startEquity;
    const path: number[] = [equity];
    let ruined = false;
    let stoppedTrading = false; // Bankruptcy barrier

    // Simulate each trade
    for (let t = 0; t < numTrades; t++) {
      // Bankruptcy barrier: If equity is too low, stop trading
      if (equity <= 100) { // $100 threshold (broker would liquidate)
        stoppedTrading = true;
        // Keep equity at current level (don't allow recovery)
        path.push(equity);
        continue;
      }

      // Draw win/loss based on win rate
      const isWin = Math.random() < winRate;

      // Get R value (with small random noise around the average, then cap)
      let r: number;
      if (isWin) {
        // Add ±10% random noise to avgWinR
        const noise = (Math.random() - 0.5) * 0.2; // -0.1 to +0.1
        r = avgWinR * (1 + noise);
        // Cap at maxRCap
        r = Math.min(r, maxRCap);
      } else {
        // Add ±10% random noise to avgLossR
        const noise = (Math.random() - 0.5) * 0.2;
        r = avgLossR * (1 + noise);
        // Losses can be more extreme, but still cap at reasonable level
        r = Math.max(r, -Math.abs(maxRCap)); // Cap losses too
      }

      // Calculate risk amount with liquidity ceiling
      // ActualRisk = min(Equity * RiskPercent, MaxRiskCap)
      const calculatedRisk = equity * (riskPct / 100);
      const actualRisk = Math.min(calculatedRisk, maxRiskCap);

      // Calculate P&L: R * actualRisk
      const pnl = r * actualRisk;

      // Update equity (never go below 0)
      equity = Math.max(0, equity + pnl);

      // Check for ruin
      if (!ruined && equity <= ruinThreshold) {
        ruined = true;
        ruinedCount++;
      }

      path.push(equity);
    }

    allPaths.push(path);
    finalEquities.push(equity);
  }

  // Compute percentile bands per trade index
  const summary: MonteCarloSummaryPoint[] = [];
  
  for (let t = 0; t <= numTrades; t++) {
    const equitiesAtT = allPaths.map(path => path[t]);
    equitiesAtT.sort((a, b) => a - b);

    summary.push({
      tradeIndex: t,
      p10: getPercentile(equitiesAtT, 10),
      p25: getPercentile(equitiesAtT, 25),
      p50: getPercentile(equitiesAtT, 50),
      p75: getPercentile(equitiesAtT, 75),
      p90: getPercentile(equitiesAtT, 90),
    });
  }

  // Return ALL paths for visualization (will be rendered with low opacity)
  const allPathsFormatted: MonteCarloPathPoint[][] = [];
  
  for (let idx = 0; idx < allPaths.length; idx++) {
    const path = allPaths[idx].map((equity, tradeIndex) => ({
      tradeIndex,
      equity,
    }));
    allPathsFormatted.push(path);
  }

  // Calculate 95th percentile of final equity for Y-axis scaling
  const sortedFinalEquities = [...finalEquities].sort((a, b) => a - b);
  const p95Index = Math.ceil(0.95 * sortedFinalEquities.length) - 1;
  const p95FinalEquity = sortedFinalEquities[Math.max(0, p95Index)];

  return {
    summary,
    samplePaths: allPathsFormatted, // Now contains all paths, not just 3
    ruinProbability: ruinedCount / iterations,
    endEquityDistribution: finalEquities,
    p95FinalEquity,
  };
}

/**
 * Calculate percentile from sorted array
 */
function getPercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

