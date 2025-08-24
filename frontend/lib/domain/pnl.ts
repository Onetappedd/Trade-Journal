export type AssetType = 'stock'|'option'|'futures'|'crypto';
export type Side = 'buy'|'sell';

export interface Trade {
  id: string;
  symbol: string;
  asset_type: AssetType;
  side: Side;
  quantity: number;            // units/contracts/shares
  entry_price: number;         // per-unit
  exit_price?: number|null;    // per-unit
  fees?: number|null;
  multiplier?: number|null;    // options default 100
  point_value?: number|null;   // futures ES=50 etc (allow override)
  last_price?: number|null;    // for unrealized on open trades
  entry_date: string;          // ISO
  exit_date?: string|null;     // ISO
}

const FUTURES_POINT_VALUES: Record<string, number> = {
  ES:50, MES:5, NQ:20, MNQ:2, YM:5, MYM:0.5, RTY:50, M2K:5, CL:1000, MCL:100, GC:100, MGC:10, SI:5000, SIL:1000,
};

export function inferPointValue(symbol?: string, override?: number|null, mult?: number|null): number {
  if (override && override > 0) return override;
  if (mult && mult > 0) return mult;
  const key = symbol?.toUpperCase && Object.keys(FUTURES_POINT_VALUES).find(k => symbol!.toUpperCase().startsWith(k));
  return key ? FUTURES_POINT_VALUES[key] : 1;
}

function dir(side: Side): number { 
  return side === 'buy' ? 1 : -1; 
}

// Per-trade realized/unrealized (exit->realized; else last->unrealized)
export function tradePnl(tr: Trade): { realized: number; unrealized: number; total: number } {
  const q = Number(tr.quantity||0);
  const entry = Number(tr.entry_price||0);
  const fees = Number(tr.fees||0);
  const d = dir(tr.side);
  const exit = tr.exit_price==null ? null : Number(tr.exit_price);
  const last = tr.last_price==null ? null : Number(tr.last_price);

  let realized=0, unrealized=0;
  
  if (tr.asset_type==='option') {
    const mult = Number(tr.multiplier||100);
    if (exit!=null) {
      realized = (exit-entry)*q*mult*d - fees;
    } else if (last!=null) {
      unrealized = (last-entry)*q*mult*d - fees;
    }
  } else if (tr.asset_type==='futures') {
    const pv = inferPointValue(tr.symbol, tr.point_value, tr.multiplier);
    if (exit!=null) {
      realized = (exit-entry)*q*pv*d - fees;
    } else if (last!=null) {
      unrealized = (last-entry)*q*pv*d - fees;
    }
  } else {
    if (exit!=null) {
      realized = (exit-entry)*q*d - fees;  // stock/crypto
    } else if (last!=null) {
      unrealized = (last-entry)*q*d - fees;
    }
  }
  
  return { realized, unrealized, total: realized+unrealized };
}

export function isClosed(tr: Trade): boolean {
  return tr.exit_price!=null || (tr.exit_date!=null && tr.exit_date!=='');
}

// Build cumulative P&L series (date, value). If `mode='total'`, include unrealized for open trades using `last_price`.
export type PnlPoint = { t: Date; v: number };

export function buildCumulativeSeries(trades: Trade[], mode: 'realized'|'total'='total'): PnlPoint[] {
  // Create day buckets: realized P&L lands on exit_date (or entry_date if only one leg); for open positions add current unrealized to the last bucket.
  const entries: { date: string; delta: number }[] = [];
  
  for (const tr of trades) {
    const { realized, unrealized, total } = tradePnl(tr);
    const day = (isClosed(tr) ? tr.exit_date : tr.entry_date) || tr.entry_date || new Date().toISOString();
    const d = day.slice(0,10); // YYYY-MM-DD
    entries.push({ date: d, delta: mode==='realized' ? realized : total });
  }
  
  // Aggregate by day then cumulative sum by ascending date
  const map = new Map<string, number>();
  for (const e of entries) {
    map.set(e.date, (map.get(e.date)||0) + e.delta);
  }
  
  const days = Array.from(map.entries()).sort((a,b)=>a[0]<b[0]?-1:1);
  let run=0;
  return days.map(([d,delta]) => { 
    run += delta; 
    return { t: new Date(d+'T00:00:00Z'), v: run }; 
  });
}

// Convert TradeRow to Trade for compatibility
export function convertTradeRow(tradeRow: any): Trade {
  return {
    id: tradeRow.id,
    symbol: tradeRow.symbol,
    asset_type: tradeRow.asset_type,
    side: tradeRow.side,
    quantity: tradeRow.quantity,
    entry_price: tradeRow.entry_price,
    exit_price: tradeRow.exit_price,
    fees: tradeRow.fees,
    multiplier: tradeRow.multiplier,
    point_value: tradeRow.point_value,
    last_price: tradeRow.last_price,
    entry_date: tradeRow.entry_date,
    exit_date: tradeRow.exit_date,
  };
}
