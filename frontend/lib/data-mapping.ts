import { Trade } from "@/lib/domain/trades";

// Map raw database row to our domain Trade type
export function mapRowToTrade(r: any): Trade {
  return {
    id: String(r.id),
    symbol: r.symbol,
    asset_type: r.asset_type as Trade['asset_type'],
    side: r.side as Trade['side'],
    quantity: Number(r.quantity || 0),
    open_price: Number(r.open_price || 0),
    close_price: r.close_price == null ? null : Number(r.close_price),
    fees: r.fees == null ? 0 : Number(r.fees),
    multiplier: r.multiplier == null ? null : Number(r.multiplier),
    point_value: r.point_value == null ? null : Number(r.point_value),
    remaining_qty: r.remaining_qty == null ? null : Number(r.remaining_qty),
    last_price: r.last_price == null ? null : Number(r.last_price),
    opened_at: r.opened_at,
    closed_at: r.closed_at ?? null,
    tags: r.tags ?? null,
  };
}

// Map existing Trade type to our domain Trade type
export function mapExistingTradeToDomain(trade: any): Trade {
  return {
    id: String(trade.id),
    symbol: trade.symbol,
    asset_type: trade.assetType as Trade['asset_type'],
    side: trade.side as Trade['side'],
    quantity: Number(trade.quantity || 0),
    open_price: Number(trade.openPrice || 0),
    close_price: trade.closePrice == null ? null : Number(trade.closePrice),
    fees: trade.fees == null ? 0 : Number(trade.fees),
    multiplier: trade.multiplier == null ? null : Number(trade.multiplier),
    point_value: trade.pointValue == null ? null : Number(trade.pointValue),
    remaining_qty: trade.remainingQty == null ? null : Number(trade.remainingQty),
    last_price: trade.lastPrice == null ? null : Number(trade.lastPrice),
    opened_at: trade.openedAt,
    closed_at: trade.closedAt ?? null,
    tags: trade.tags ?? null,
  };
}

// Apply domain calculations to trades
export function applyDomainCalculations(trades: Trade[]) {
  return trades.map(trade => ({
    ...trade,
    _status: trade.status || 'Open', // fallback for backward compatibility
    _pnl: trade._pnl || { realized: 0, unrealized: 0, total: 0 }, // fallback for backward compatibility
  }));
}
