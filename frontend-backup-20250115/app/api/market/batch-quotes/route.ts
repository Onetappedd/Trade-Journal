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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbolsParam = url.searchParams.get('symbols');
  if (!symbolsParam) return fail('Symbols are required', 400);
  const symbols = symbolsParam
    .split(',')
    .map((s) => s.toUpperCase().replace(/[^A-Z0-9.]/g, ''))
    .filter(Boolean);
  if (!symbols.length) return fail('No valid symbols', 400);

  let usingFallback = false;
  const data: Array<{ symbol: string; price: number; change: number; changePct: number }> = [];
  await Promise.allSettled(
    symbols.map(async (symbol) => {
      let price = 100,
        change = 0,
        changePct = 0;
      try {
        if (has('FINNHUB_API_KEY')) {
          const resp = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`,
          );
          if (resp.ok) {
            const { c, d, dp } = await resp.json();
            if (typeof c === 'number') {
              price = c;
              change = typeof d === 'number' ? d : 0;
              changePct = typeof dp === 'number' ? dp : price ? (change / price) * 100 : 0;
              data.push({ symbol, price, change, changePct });
              return;
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
              data.push({ symbol, price, change, changePct });
              return;
            }
          }
        }
        // Fallback symbol
        usingFallback = true;
        data.push({ symbol, price, change, changePct });
      } catch {
        usingFallback = true;
        data.push({ symbol, price, change, changePct });
      }
    }),
  );
  return ok({ data }, usingFallback);
}
