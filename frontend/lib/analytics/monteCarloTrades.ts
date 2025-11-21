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
}

export interface BootstrapParams {
  rValues: Array<{ r: number }>; // Historical R-multiples
  startEquity: number;
  riskPct: number;  // Risk per trade as % of equity (e.g., 1 = 1%)
  numTrades: number;
  iterations: number;
  ruinThreshold?: number; // Equity threshold for "ruin" (default: 0)
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
  } = params;

  if (rValues.length === 0) {
    throw new Error('Cannot run bootstrap simulation with no R-values');
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

    // Simulate each trade
    for (let t = 0; t < numTrades; t++) {
      // Sample a random R from historical data
      const randomIndex = Math.floor(Math.random() * rValues.length);
      const sampledR = rValues[randomIndex].r;

      // Calculate risk amount for this trade
      const riskAmount = equity * (riskPct / 100);

      // Calculate P&L: R * riskAmount
      const pnl = sampledR * riskAmount;

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

  return {
    summary,
    samplePaths: allPathsFormatted, // Now contains all paths, not just 3
    ruinProbability: ruinedCount / iterations,
    endEquityDistribution: finalEquities,
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

    // Simulate each trade
    for (let t = 0; t < numTrades; t++) {
      // Draw win/loss based on win rate
      const isWin = Math.random() < winRate;

      // Get R value (with small random noise around the average)
      let r: number;
      if (isWin) {
        // Add ±10% random noise to avgWinR
        const noise = (Math.random() - 0.5) * 0.2; // -0.1 to +0.1
        r = avgWinR * (1 + noise);
      } else {
        // Add ±10% random noise to avgLossR
        const noise = (Math.random() - 0.5) * 0.2;
        r = avgLossR * (1 + noise);
      }

      // Calculate risk amount for this trade
      const riskAmount = equity * (riskPct / 100);

      // Calculate P&L: R * riskAmount
      const pnl = r * riskAmount;

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

  return {
    summary,
    samplePaths: allPathsFormatted, // Now contains all paths, not just 3
    ruinProbability: ruinedCount / iterations,
    endEquityDistribution: finalEquities,
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

