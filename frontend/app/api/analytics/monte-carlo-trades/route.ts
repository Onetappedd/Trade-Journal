/**
 * Monte Carlo Trades Simulation API
 * 
 * POST /api/analytics/monte-carlo-trades
 * 
 * Runs trade-level Monte Carlo simulation for future wealth projection.
 * Supports two modes:
 * - profileDefaults: Bootstrap from user's actual trade R-multiples
 * - parametric: Use provided win rate + avg win R + avg loss R
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { getUserTradeStats } from '@/lib/analytics/tradeStats';
import { runBootstrapSimulation, runParametricSimulation } from '@/lib/analytics/monteCarloTrades';

export const dynamic = 'force-dynamic';

type Mode = 'profileDefaults' | 'parametric';

interface MonteCarloRequestBody {
  mode: Mode;
  numTrades?: number;    // default ~500
  iterations?: number;   // default ~1000
  riskPct?: number;      // default 1
  startEquity?: number;  // default 10000
  maxRiskCap?: number;   // Maximum risk per trade (liquidity ceiling), default 5000
  // For parametric mode only:
  winRate?: number;      // 0-1 or 0-100 (we'll normalize)
  avgWinR?: number;
  avgLossR?: number;
}

const DEFAULT_NUM_TRADES = 500;
const DEFAULT_ITERATIONS = 1000;
const DEFAULT_RISK_PCT = 1;
const DEFAULT_START_EQUITY = 10000;

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseWithToken(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    // Parse request body
    const body: MonteCarloRequestBody = await request.json();
    const {
      mode,
      numTrades = DEFAULT_NUM_TRADES,
      iterations = DEFAULT_ITERATIONS,
      riskPct = DEFAULT_RISK_PCT,
      startEquity = DEFAULT_START_EQUITY,
      maxRiskCap = 5000, // Default: $5,000 max risk per trade (liquidity ceiling)
      winRate: rawWinRate,
      avgWinR,
      avgLossR,
    } = body;

    // Validate mode
    if (mode !== 'profileDefaults' && mode !== 'parametric') {
      return NextResponse.json(
        { error: 'Invalid mode', details: 'Mode must be "profileDefaults" or "parametric"' },
        { status: 400 }
      );
    }

    // Validate parameters
    if (numTrades < 1 || numTrades > 10000) {
      return NextResponse.json(
        { error: 'Invalid numTrades', details: 'numTrades must be between 1 and 10000' },
        { status: 400 }
      );
    }

    if (iterations < 10 || iterations > 10000) {
      return NextResponse.json(
        { error: 'Invalid iterations', details: 'iterations must be between 10 and 10000' },
        { status: 400 }
      );
    }

    if (riskPct < 0.1 || riskPct > 10) {
      return NextResponse.json(
        { error: 'Invalid riskPct', details: 'riskPct must be between 0.1 and 10' },
        { status: 400 }
      );
    }

    if (startEquity <= 0) {
      return NextResponse.json(
        { error: 'Invalid startEquity', details: 'startEquity must be greater than 0' },
        { status: 400 }
      );
    }

    let result;
    let stats: any = {
      mode,
      numTrades,
      iterations,
      riskPct,
      startEquity,
    };

    if (mode === 'profileDefaults') {
      // Get user's trade stats
      const tradeStats = await getUserTradeStats(supabase, user.id, 100);

      if (tradeStats.sampleSizeTooSmall) {
        return NextResponse.json(
          {
            error: 'Insufficient data',
            details: `You need at least 20 completed trades to run a simulation. You currently have ${tradeStats.sampleSize} trades.`,
            sampleSize: tradeStats.sampleSize,
          },
          { status: 422 }
        );
      }

      // Run bootstrap simulation with realistic constraints
      result = runBootstrapSimulation({
        rValues: tradeStats.rValues.map(tr => ({ r: tr.r })),
        startEquity,
        riskPct,
        numTrades,
        iterations,
        ruinThreshold: startEquity * 0.5, // 50% drawdown = ruin
        maxRiskCap, // Liquidity ceiling
        // maxRCap will be calculated as 95th percentile automatically
      });

      stats = {
        ...stats,
        sampleSize: tradeStats.sampleSize,
        winRate: tradeStats.winRate,
        avgWinR: tradeStats.avgWinR,
        avgLossR: tradeStats.avgLossR,
        avgAbsLoss: tradeStats.avgAbsLoss,
      };

    } else {
      // Parametric mode
      // Normalize winRate (accept 0-1 or 0-100)
      let winRate = rawWinRate;
      if (winRate === undefined) {
        return NextResponse.json(
          { error: 'Missing parameters', details: 'winRate, avgWinR, and avgLossR are required for parametric mode' },
          { status: 400 }
        );
      }

      // Normalize winRate to 0-1 if it's 0-100
      if (winRate > 1) {
        winRate = winRate / 100;
      }

      if (winRate < 0 || winRate > 1) {
        return NextResponse.json(
          { error: 'Invalid winRate', details: 'winRate must be between 0 and 1 (or 0 and 100)' },
          { status: 400 }
        );
      }

      if (avgWinR === undefined || avgLossR === undefined) {
        return NextResponse.json(
          { error: 'Missing parameters', details: 'avgWinR and avgLossR are required for parametric mode' },
          { status: 400 }
        );
      }

      if (avgWinR <= 0) {
        return NextResponse.json(
          { error: 'Invalid avgWinR', details: 'avgWinR must be greater than 0' },
          { status: 400 }
        );
      }

      if (avgLossR >= 0) {
        return NextResponse.json(
          { error: 'Invalid avgLossR', details: 'avgLossR must be negative' },
          { status: 400 }
        );
      }

      // Run parametric simulation with realistic constraints
      result = runParametricSimulation({
        winRate,
        avgWinR,
        avgLossR,
        startEquity,
        riskPct,
        numTrades,
        iterations,
        ruinThreshold: startEquity * 0.5, // 50% drawdown = ruin
        maxRiskCap, // Liquidity ceiling
        maxRCap: 5, // Cap R at 5R for parametric mode
      });

      stats = {
        ...stats,
        winRate,
        avgWinR,
        avgLossR,
      };
    }

    return NextResponse.json({
      success: true,
      result,
      stats,
    });

  } catch (error: any) {
    console.error('Monte Carlo simulation error:', error);
    return NextResponse.json(
      {
        error: 'Simulation failed',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

