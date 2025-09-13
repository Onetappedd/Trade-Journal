import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
};

function ok<T>(payload: T, usingFallback = false, init: ResponseInit = {}) {
  return NextResponse.json(
    { ok: true, usingFallback, ...payload },
    {
      headers: { ...CACHE_HEADERS, ...(init.headers || {}) },
      status: init.status || 200,
    },
  );
}

function fail(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function has(key: string) {
  return typeof process.env[key] === 'string' && process.env[key]!.length > 0;
}

export async function GET(req: Request, { params }: { params: { ticker: string } }) {
  const symbol = (params.ticker || '')
    .toUpperCase()
    .replace(/[^A-Z0-9.]/g, '')
    .slice(0, 16);
  if (!symbol) return fail('Ticker is required', 400);
  let usingFallback = false;
  let price = 100,
    change = 0,
    changePct = 0,
    volume = 50000;
  try {
    if (has('FINNHUB_API_KEY')) {
      const resp = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`,
      );
      if (resp.ok) {
        const { c, d, dp } = await resp.json();
        if (c !== undefined) {
          price = c;
          change = typeof d === 'number' ? d : 0;
          changePct = typeof dp === 'number' ? dp : price ? (change / price) * 100 : 0;
          // Volume is not available in Finnhub quote endpoint
          return ok({ data: { symbol, price, change, changePct, volume } }, false);
        }
      }
    } else if (has('POLYGON_API_KEY')) {
      const poly = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${process.env.POLYGON_API_KEY}`,
      );
      if (poly.ok) {
        const json = await poly.json();
        if (json && json.results && Array.isArray(json.results) && json.results.length > 0) {
          const r = json.results[0];
          price = r.c;
          change = r.c - r.o;
          changePct = price ? (change / price) * 100 : 0;
          volume = r.v;
          return ok({ data: { symbol, price, change, changePct, volume } }, false);
        }
      }
    }
    usingFallback = true;
  } catch {
    usingFallback = true;
  }
  return ok({ data: { symbol, price, change, changePct, volume } }, usingFallback);
}
