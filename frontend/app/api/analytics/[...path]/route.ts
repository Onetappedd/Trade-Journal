import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
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
  const subpath = params.path.join('/');
  // Handle /api/analytics/cards with a stub response for now
  if (subpath === 'cards') {
    return NextResponse.json({
      net: 1000,
      realized: 800,
      fees: 50,
      winRate: 0.6,
      avgWin: 200,
      avgLoss: -100,
      expectancy: 0.5,
      profitFactor: 1.5,
      tradeCount: 20,
      maxDrawdown: -200,
      sharpe: 1.2,
      sortino: 1.5,
    });
  }
  // Fallback: proxy to Edge Function or remote HTTP analytics endpoint
  const url = `${SUPABASE_URL}/functions/v1/${subpath}`;
  const body = await req.text();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body,
  });
  const proxyRes = new NextResponse(res.body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/json',
    },
  });
  return proxyRes;
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
