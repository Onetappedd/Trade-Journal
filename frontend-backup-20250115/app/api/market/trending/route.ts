import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
};

function ok<T>(payload: T, usingFallback = false, init?: ResponseInit) {
  return NextResponse.json(
    { ok: true, usingFallback, ...payload },
    {
      status: init?.status ?? 200,
      headers: { ...CACHE_HEADERS, ...(init?.headers || {}) },
    },
  );
}
function fail(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
const has = (k: string) => typeof process.env[k] === 'string' && process.env[k]!.length > 0;
type Row = { symbol: string; price: number; changePct: number };
const FALLBACK_TICKERS = ['SPY', 'QQQ', 'AAPL', 'NVDA', 'MSFT', 'META', 'TSLA'];
export async function GET() {
  try {
    const results: Row[] = [];
    let usingFallback = false;
    if (has('POLYGON_API_KEY')) {
      try {
        const key = process.env.POLYGON_API_KEY!;
        const [gRes, lRes] = await Promise.all([
          fetch(
            `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/gainers?apiKey=${key}`,
          ),
          fetch(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/losers?apiKey=${key}`),
        ]);
        if (gRes.ok && lRes.ok) {
          const gData = await gRes.json();
          const lData = await lRes.json();
          const rows: Row[] = [];
          const pushMap = (arr: any[]) => {
            for (const x of arr) {
              const sym = String(x?.ticker || x?.T || '').toUpperCase();
              const price = Number(x?.last?.price ?? x?.p ?? x?.close ?? x?.c ?? 0);
              const changePct = Number(x?.todaysChangePerc ?? x?.dp ?? 0);
              if (sym && Number.isFinite(price) && Number.isFinite(changePct)) {
                rows.push({ symbol: sym, price, changePct });
              }
            }
          };
          pushMap(gData?.tickers ?? gData?.results ?? []);
          pushMap(lData?.tickers ?? lData?.results ?? []);
          const uniq = new Map<string, Row>();
          for (const r of rows) {
            if (!uniq.has(r.symbol)) uniq.set(r.symbol, r);
          }
          results.push(...Array.from(uniq.values()).slice(0, 12));
        } else {
          usingFallback = true;
        }
      } catch {
        usingFallback = true;
      }
    } else if (has('FINNHUB_API_KEY')) {
      try {
        const key = process.env.FINNHUB_API_KEY!;
        const syms = FALLBACK_TICKERS.slice(0, 7);
        const out: Row[] = [];
        const qs = syms.map((s) =>
          fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s)}&token=${key}`)
            .then(async (r) => (r.ok ? r.json() : null))
            .then((j) => {
              if (!j) return null;
              const price = Number(j?.c ?? 0);
              const changePct = Number(j?.dp ?? 0);
              if (Number.isFinite(price) && Number.isFinite(changePct)) {
                out.push({ symbol: s, price, changePct });
              }
              return null;
            })
            .catch(() => null),
        );
        await Promise.all(qs);
        if (out.length) {
          results.push(...out);
        } else {
          usingFallback = true;
        }
      } catch {
        usingFallback = true;
      }
    } else {
      usingFallback = true;
    }
    if (usingFallback || results.length === 0) {
      const alt: Row[] = FALLBACK_TICKERS.map((s, i) => {
        const price = 100 + i * 5;
        const changePct = (i % 2 === 0 ? 0.6 : -0.35) + (i % 3 === 0 ? 0.15 : 0);
        return { symbol: s, price, changePct: Number(changePct.toFixed(2)) };
      });
      return ok({ data: alt }, true);
    }
    return ok({ data: results }, false);
  } catch (err) {
    return fail('Unexpected error in /market/trending');
  }
}
