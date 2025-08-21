import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30'
};

function ok<T>(payload: T, usingFallback = false, init: ResponseInit = {}) {
  return NextResponse.json({ ok: true, usingFallback, ...payload }, {
    headers: { ...CACHE_HEADERS, ...(init.headers || {}) },
    status: init.status || 200,
  });
}

function fail(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function has(key: string) {
  return typeof process.env[key] === 'string' && process.env[key]!.length > 0;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return fail('Search query is required', 400);
  let usingFallback = false;
  // Try providers
  try {
    if (has('FINNHUB_API_KEY')) {
      const resp = await fetch(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${process.env.FINNHUB_API_KEY}`);
      if (resp.ok) {
        const { result } = await resp.json();
        if (Array.isArray(result)) {
          const data = result.map((r: any) => ({ symbol: r.symbol, name: r.description })).filter((r: any) => !!r.symbol);
          return ok({ data }, false);
        }
      }
    } else if (has('POLYGON_API_KEY')) {
      const resp = await fetch(`https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(q)}&active=true&apiKey=${process.env.POLYGON_API_KEY}`);
      if (resp.ok) {
        const { results } = await resp.json();
        if (Array.isArray(results)) {
          const data = results.map((r: any) => ({ symbol: r.ticker, name: r.name })).filter((r: any) => !!r.symbol);
          return ok({ data }, false);
        }
      }
    }
    usingFallback = true;
  } catch {
    usingFallback = true;
  }
  // Fallback: static mock filter
  const all = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'NVDA', name: 'Nvidia' },
    { symbol: 'AMZN', name: 'Amazon' }
  ];
  const data = all.filter(({ symbol, name }) =>
    symbol.includes(q.toUpperCase()) || name.toLowerCase().includes(q.toLowerCase())
  );
  return ok({ data }, usingFallback);
}
