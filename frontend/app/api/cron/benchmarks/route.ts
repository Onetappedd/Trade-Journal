/**
 * Benchmark Prices Cron Job
 * Fetches daily SPY/QQQ data from Yahoo Finance and stores in benchmark_prices table
 * 
 * Runs at 21:00 UTC weekdays (0 21 * * 1-5) via Vercel Cron
 * Requires CRON_SECRET environment variable for authentication
 * 
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/benchmarks",
 *     "schedule": "0 21 * * 1-5"
 *   }]
 * }
 * 
 * Manual backfill: GET /api/cron/benchmarks?backfill=true
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import YahooFinance from 'yahoo-finance2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Instantiate yahoo-finance2 (required for v3)
const yahooFinance = new YahooFinance();

const SYMBOLS = ['SPY', 'QQQ'];

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('[Benchmarks Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      console.error('[Benchmarks Cron] Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for backfill mode
    const searchParams = request.nextUrl.searchParams;
    const isBackfill = searchParams.get('backfill') === 'true';

    // Create Supabase client with service role (bypasses RLS for writes)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const startTime = Date.now();
    const results: Array<{ symbol: string; count: number }> = [];

    // Determine date range
    const now = new Date();
    let period1: Date;
    let period2: Date = now;

    if (isBackfill) {
      // Backfill: fetch from 2020-01-01 to today
      period1 = new Date('2020-01-01');
      console.log(`[Benchmarks Cron] Backfill mode: fetching from ${period1.toISOString()} to ${period2.toISOString()}`);
    } else {
      // Normal mode: fetch last 7 days
      period1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      console.log(`[Benchmarks Cron] Incremental mode: fetching last 7 days`);
    }

    // Fetch data for each symbol
    for (const symbol of SYMBOLS) {
      try {
        console.log(`[Benchmarks Cron] Fetching ${symbol}...`);

        const queryOptions = {
          period1: period1,
          period2: period2,
          interval: '1d' as const,
        };

        // yahoo-finance2 historical returns an array of quote objects
        type QuoteType = {
          date: Date | string;
          close: number | null;
          adjClose?: number | null;
          adjustedClose?: number | null;
          volume?: number | null;
        };

        console.log(`[Benchmarks Cron] Calling yahooFinance.historical for ${symbol} with options:`, JSON.stringify(queryOptions));
        const historical = (await yahooFinance.historical(symbol, queryOptions)) as QuoteType[] | null | undefined;
        console.log(`[Benchmarks Cron] Received response for ${symbol}:`, {
          isNull: historical === null,
          isUndefined: historical === undefined,
          isArray: Array.isArray(historical),
          length: Array.isArray(historical) ? historical.length : 'N/A',
          type: typeof historical
        });

        // Type guard: ensure historical is an array
        if (!historical || !Array.isArray(historical) || historical.length === 0) {
          console.warn(`[Benchmarks Cron] No data returned for ${symbol}`, {
            historical,
            isArray: Array.isArray(historical),
            length: Array.isArray(historical) ? historical.length : 'N/A'
          });
          results.push({ symbol, count: 0 });
          continue;
        }

        // Map Yahoo Finance response to database schema
        const rows = historical
          .filter((quote) => {
            // Filter out rows missing required fields
            return quote.date && quote.close !== null && quote.close !== undefined;
          })
          .map((quote) => {
            // Extract date as YYYY-MM-DD string
            const dateStr = quote.date instanceof Date
              ? quote.date.toISOString().slice(0, 10)
              : new Date(quote.date).toISOString().slice(0, 10);

            return {
              symbol,
              date: dateStr,
              close: quote.close,
              adjusted_close: (quote.adjClose ?? quote.adjustedClose ?? quote.close) as number,
              volume: quote.volume ?? null,
            };
          });

        if (rows.length === 0) {
          console.warn(`[Benchmarks Cron] No valid rows after filtering for ${symbol}`);
          results.push({ symbol, count: 0 });
          continue;
        }

        // Upsert into benchmark_prices (idempotent)
        const { error: upsertError } = await supabase
          .from('benchmark_prices')
          .upsert(rows, {
            onConflict: 'symbol,date',
          });

        if (upsertError) {
          console.error(`[Benchmarks Cron] Upsert error for ${symbol}:`, upsertError);
          results.push({ symbol, count: 0 });
        } else {
          console.log(`[Benchmarks Cron] Successfully upserted ${rows.length} rows for ${symbol}`);
          results.push({ symbol, count: rows.length });
        }
      } catch (symbolError: any) {
        console.error(`[Benchmarks Cron] Error fetching ${symbol}:`, symbolError);
        console.error(`[Benchmarks Cron] Error stack:`, symbolError?.stack);
        results.push({ symbol, count: 0, error: symbolError?.message || String(symbolError) });
      }
    }

    const duration = Date.now() - startTime;
    const totalRows = results.reduce((sum, r) => sum + r.count, 0);

    console.log(`[Benchmarks Cron] Completed in ${duration}ms. Total rows: ${totalRows}`);

    return NextResponse.json({
      success: true,
      mode: isBackfill ? 'backfill' : 'incremental',
      results,
      totalRows,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Benchmarks Cron] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch benchmarks',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

