// Market data provider with cache and failover
import { createServerClient } from "@supabase/ssr"
import { addDays, format, parseISO } from "date-fns"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const POLYGON_API_KEY = process.env.POLYGON_API_KEY || ''
const TIINGO_API_KEY = process.env.TIINGO_API_KEY || ''

interface DailyClose { day: string; close: number }
const memoCache: Record<string, { value: DailyClose[]; expires: number }> = {}

function normalizeSymbol(symbol: string) { return symbol.replace(/\s+/g, '').toUpperCase() }

// Helper to generate [day1, day2, ...] YYYY-MM-DD between start/end (inclusive)
function genDateSeries(start: string, end: string): string[] {
  const out = []
  let d = parseISO(start)
  const e = parseISO(end)
  while (d <= e) {
    out.push(format(d,'yyyy-MM-dd'))
    d = addDays(d,1)
  }
  return out
}

async function getFromCache(symbol: string, start: string, end: string) {
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase
    .from('market_cache')
    .select('day, close, fetched_at')
    .eq('symbol', symbol)
    .gte('day', start)
    .lte('day', end)
  if (error) throw new Error('Cache read error: ' + error.message)
  const map = new Map<string, { close: number; fetched_at: string }>()
  for (const row of data || []) {
    map.set(row.day, { close: Number(row.close), fetched_at: row.fetched_at })
  }
  return map
}

async function upsertCache(symbol: string, rows: { day: string, close: number }[]) {
  if (!rows.length) return;
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  await supabase.from('market_cache').upsert(
    rows.map(r => ({ symbol, day: r.day, close: r.close, fetched_at: new Date().toISOString() })),
    { onConflict: 'symbol,day' }
  )
}

async function fetchPolygon(symbol: string, start: string, end: string): Promise<DailyClose[]> {
  if (!POLYGON_API_KEY) throw new Error("Polygon API key missing")
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${start}/${end}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_API_KEY}`
  const res = await fetch(url)
  if (res.status === 429) throw new Error('Polygon rate limited')
  if (!res.ok) throw new Error('Polygon error ' + res.status)
  const json = await res.json()
  if (!json.results) return []
  return json.results.map((r: any) => ({
    day: format(new Date(r.t), 'yyyy-MM-dd'),
    close: r.c
  }))
}

async function fetchTiingo(symbol: string, start: string, end: string): Promise<DailyClose[]> {
  if (!TIINGO_API_KEY) throw new Error("Tiingo API key missing")
  const url = `https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=${start}&endDate=${end}&token=${TIINGO_API_KEY}`
  const res = await fetch(url)
  if (res.status === 429) throw new Error('Tiingo rate limited')
  if (!res.ok) throw new Error('Tiingo error ' + res.status)
  const json = await res.json()
  if (!Array.isArray(json)) return []
  return json.map((r: any) => ({ day: r.date.slice(0,10), close: Number(r.adjClose ?? r.close) }))
}

export async function getDailyCloses(ticker: string, start: string, end: string): Promise<DailyClose[]> {
  const symbol = normalizeSymbol(ticker)
  const dates = genDateSeries(start, end)
  const memoKey = `${symbol}:${start}:${end}`
  const now = Date.now()
  // 1. In-memory 60s memo
  if (memoCache[memoKey] && memoCache[memoKey].expires > now) return memoCache[memoKey].value
  // 2. Query Supabase cache (market_cache)
  const cache = await getFromCache(symbol, start, end)
  const missing = dates.filter(d => !cache.has(d) || (Date.now()-new Date(cache.get(d)?.fetched_at||0).getTime()) > 86400000)
  let fills: DailyClose[] = []
  if (missing.length > 0) {
    try {
      fills = await fetchPolygon(symbol, start, end)
    } catch (e) {
      try { fills = await fetchTiingo(symbol, start, end) } catch (e) {}
    }
    if (fills.length) await upsertCache(symbol, fills)
  }
  // Merge cache + fills, prefer latest fetched
  const all: Record<string, DailyClose> = {}
  for (const d of dates) {
    const cached = cache.get(d)
    all[d] = { day: d, close: cached?.close ?? null }
  }
  for (const f of fills) all[f.day] = f
  const result: DailyClose[] = dates.map(d => all[d]).filter(x => x && x.close != null) // filter out missing if any
  memoCache[memoKey] = { value: result, expires: now + 60000 }
  return result
}
