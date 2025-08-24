export type AssetType = 'stock' | 'option' | 'futures' | 'crypto';
export type Side = 'Buy' | 'Sell';

export interface Trade {
  id: string;
  symbol: string;
  asset_type: AssetType;
  side: Side;                     // opening side
  quantity: number;               // shares/contracts/units (positive)
  open_price: number;             // per-share/contract/unit
  close_price?: number | null;    // per-share/contract/unit, null when not closed
  fees?: number | null;           // total fees/commissions across legs
  multiplier?: number | null;     // options/futures override if provided by DB
  point_value?: number | null;    // futures override; if unset infer from symbol
  remaining_qty?: number | null;  // if present, used for Partial/Open logic
  opened_at?: string;
  closed_at?: string | null;
  tags?: string[] | null;
  // optional for unrealized: last_price from backend snapshot
  last_price?: number | null;
}

export type PnL = { realized: number; unrealized: number; total: number };

const FUTURES_POINT_VALUE: Record<string, number> = {
  ES: 50, MES: 5,
  NQ: 20, MNQ: 2,
  YM: 5,  MYM: 0.5,
  RTY: 50, M2K: 5,
  CL: 1000, MCL: 100,
  GC: 100, MGC: 10,
  SI: 5000, SIL: 1000,
};

export function getFuturesPointValue(symbol: string, override?: number | null, multiplier?: number | null) {
  if (override && override > 0) return override;
  if (multiplier && multiplier > 0) return multiplier; // allow DB override
  const key = Object.keys(FUTURES_POINT_VALUE).find(k => symbol?.toUpperCase().startsWith(k));
  return key ? FUTURES_POINT_VALUE[key] : 1; // safe fallback
}

export function isClosed(trade: Trade): boolean {
  if (trade.close_price != null) return true;
  if (trade.closed_at) return true;
  if (trade.remaining_qty != null) return trade.remaining_qty <= 0;
  return false;
}

export function statusOf(trade: Trade): 'Open'|'Closed'|'Partial' {
  if (isClosed(trade)) return 'Closed';
  if (trade.remaining_qty != null && trade.remaining_qty < trade.quantity) return 'Partial';
  return 'Open';
}

function dir(side: Side) { return side === 'Buy' ? 1 : -1; }

export function calcPnL(trade: Trade): PnL {
  const q = Number(trade.quantity || 0);
  const fees = Number(trade.fees || 0);
  const open = Number(trade.open_price || 0);
  const close = trade.close_price != null ? Number(trade.close_price) : null;
  const last = trade.last_price != null ? Number(trade.last_price) : null;
  const d = dir(trade.side);

  let realized = 0, unrealized = 0;

  if (trade.asset_type === 'option') {
    const mult = Number(trade.multiplier || 100);
    if (close != null) realized = (close - open) * q * mult * d - fees;
    else if (last != null) unrealized = (last - open) * q * mult * d - fees;
  } else if (trade.asset_type === 'futures') {
    const pv = getFuturesPointValue(trade.symbol, trade.point_value, trade.multiplier);
    if (close != null) realized = (close - open) * q * pv * d - fees;
    else if (last != null) unrealized = (last - open) * q * pv * d - fees;
  } else {
    // stock & crypto = per-unit pricing
    if (close != null) realized = (close - open) * q * d - fees;
    else if (last != null) unrealized = (last - open) * q * d - fees;
  }
  return { realized, unrealized, total: realized + unrealized };
}

export const usd = (n: number) =>
  n == null || Number.isNaN(n) ? '—'
  : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
