import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  // Create Supabase server client with cookies
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => req.cookies.get(key)?.value,
      set: () => {},
      remove: () => {},
    },
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const filters = await req.json();
  // Parse filters
  const { start, end, assetClasses, accounts, symbols } = filters;
  const userId = session.user.id;

  // Call the SQL function for equity curve, drawdown, and daily returns
  const { data, error } = await supabase.rpc('get_equity_curve', {
    uid: userId,
    start_date: start,
    end_date: end,
    asset_classes: assetClasses?.length ? assetClasses : null,
    account_ids: accounts?.length ? accounts : null,
    symbols: symbols?.length ? symbols : null,
  } as any);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const equityCurve = data.map((row: any) => ({ t: row.day, equity: Number(row.equity) }));
  const maxDrawdown = Math.min(...data.map((row: any) => Number(row.drawdown) || 0));
  const returns = data
    .map((row: any) => Number(row.daily_return))
    .filter((r: number) => r !== null && !isNaN(r));
  const avgReturn = returns.reduce((a: number, b: number) => a + b, 0) / (returns.length || 1);
  const stddev = Math.sqrt(
    returns.reduce((a: number, b: number) => a + Math.pow(b - avgReturn, 2), 0) / (returns.length || 1),
  );
  const downsideReturns = returns.filter((r: number) => r < 0);
  const downsideStddev = Math.sqrt(
    downsideReturns.reduce((a: number, b: number) => a + Math.pow(b - avgReturn, 2), 0) /
      (downsideReturns.length || 1),
  );
  const sharpe = stddev ? (avgReturn / stddev) * Math.sqrt(252) : 0;
  const sortino = downsideStddev ? (avgReturn / downsideStddev) * Math.sqrt(252) : 0;

  return NextResponse.json({
    netPL: equityCurve.length ? equityCurve[equityCurve.length - 1].equity : 0,
    equityCurve,
    sharpe,
    sortino,
    maxDrawdown,
  });
}
