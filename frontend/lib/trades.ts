import { createClient } from '@/lib/supabase';

export interface Trade {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number;
  entry_date: string;
  exit_price?: number | null;
  exit_date?: string | null;
  status?: string;
  asset_type?: string;
  multiplier?: number | null;
  underlying?: string | null;
  option_type?: string | null;
  strike_price?: number | null;
  expiration_date?: string | null;
  [key: string]: any; // allow attachments/tags/notes, etc.
}

export interface GetTradesParams {
  search?: string;
  assetType?: string;
  side?: string;
  strategy?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

export async function getTrades(params: GetTradesParams = {}): Promise<Trade[]> {
  const supabase = createClient();
  let query = supabase.from('trades').select('*');
  if (params.limit) query = query.limit(params.limit);
  if (params.offset) query = query.range(params.offset, params.offset + params.limit - 1);
  if (params.assetType && params.assetType !== 'all') query = query.eq('asset_type', params.assetType);
  if (params.side && params.side !== 'all') query = query.eq('side', params.side);
  if (params.strategy) query = query.ilike('strategy', `%${params.strategy}%`);
  if (params.search) {
    // client filtering after fetch if needed (for symbol/notes/strategy/text)
  }
  if (params.dateFrom)
    query = query.gte('entry_date', params.dateFrom);
  if (params.dateTo)
    query = query.lte('entry_date', params.dateTo);
  if (params.tags && params.tags.length > 0) {
    // for now: naive clientside filtering, as tags might be array/text type
  }
  query = query.order('entry_date', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  let trades = data as Trade[];
  // Further client filtering if required (search, tags, etc.)
  if (params.search) {
    const s = params.search.toLowerCase();
    trades = trades.filter(
      (t) =>
        t.symbol.toLowerCase().includes(s) ||
        (t.notes && t.notes.toLowerCase().includes(s)) ||
        (t.strategy && t.strategy.toLowerCase().includes(s))
    );
  }
  if (params.tags && params.tags.length > 0) {
    trades = trades.filter((t) => {
      if (!t.tags) return false;
      const tagArr = Array.isArray(t.tags)
        ? t.tags
        : typeof t.tags === 'string'
        ? t.tags.split(',').map((x) => x.trim())
        : [];
      return params.tags!.every((ptag) => tagArr.includes(ptag));
    });
  }
  return trades;
}

export async function getTradeById(id: string): Promise<Trade | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('trades').select().eq('id', id).single();
  if (error) return null;
  return data as Trade;
}

export async function exportTradesCsv(params: GetTradesParams = {}): Promise<Blob> {
  const trades = await getTrades(params);
  const headers = [
    'id',
    'symbol',
    'side',
    'quantity',
    'entry_price',
    'entry_date',
    'exit_price',
    'exit_date',
    'status',
    'asset_type',
    'multiplier',
    'underlying',
    'option_type',
    'strike_price',
    'expiration_date',
    'strategy',
    'tags',
    'notes',
  ];
  const csv = [headers.join(','), ...trades.map((t) => headers.map((h) => JSON.stringify(t[h] ?? '')).join(','))].join('\n');
  return new Blob([csv], { type: 'text/csv' });
}

// === Aggregation/analytics helpers ===
export function groupBy<T, K extends keyof any>(arr: T[], fn: (row: T) => K) {
  return arr.reduce((acc, item) => {
    const k = fn(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function percent(n: number, d: number) {
  return d === 0 ? 0 : (100 * n) / d;
}

// Returns [{date: '2024-06-08', trades: [...], pnl: ...}, ...]
export function aggregateByDay(trades: Trade[]) {
  const map = new Map<string, {date: string; trades: Trade[]; pnl: number; net: number; win: number; loss: number}>();
  for (const t of trades) {
    const date = t.exit_date || t.entry_date;
    if (!date) continue;
    const day = typeof date === 'string' ? date.slice(0, 10) : date;
    const key = day;
    if (!map.has(key))
      map.set(key, { date: day, trades: [], pnl: 0, net: 0, win: 0, loss: 0 });
    const rec = map.get(key)!;
    rec.trades.push(t);
    // Net PnL logic: assumes 'buy' is long, 'sell' is short
    const multiplier = t.multiplier != null ? Number(t.multiplier) : 1;
    let tradePnL = 0;
    if (t.exit_price != null && t.entry_price != null) {
      tradePnL = (t.side === 'buy'
        ? (t.exit_price - t.entry_price)
        : (t.entry_price - t.exit_price)) * Number(t.quantity) * multiplier;
    }
    rec.pnl += tradePnL;
    rec.net += tradePnL; // alias for compatibility
    if (tradePnL > 0) rec.win++;
    else if (tradePnL < 0) rec.loss++;
  }
  return Array.from(map.values()).sort((a,b) => a.date.localeCompare(b.date));
}

// Returns {x: date, y: cumulative PnL}
export function cumulativeSeries(trades: Trade[], key: 'net' | 'gross' = 'net') {
  const days = aggregateByDay(trades);
  let running = 0;
  return days.map((rec) => {
    running += rec[key];
    return { x: rec.date, y: running };
  });
}
