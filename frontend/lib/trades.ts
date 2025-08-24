import { createClient } from '@/lib/supabase';
import type { AssetType, Trade, TradeListParams, TradeListResult } from '@/types/trade';

export type TradeListParams = {
  userId: string;
  page?: number;
  pageSize?: number;
  sort?: { field: string; dir: 'asc' | 'desc' };
  dateFrom?: string;
  dateTo?: string;
  assetType?: AssetType[];
  side?: string[];
  accountId?: string;
  symbol?: string;
  text?: string;
};

export type TradeListResult = {
  rows: Trade[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getTrades(params: TradeListParams): Promise<TradeListResult> {
  // Source: Supabase (see export logic)
  const supabase = createClient();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.max(1, Math.min(Number(params.pageSize) || 50, 200));
  let query = supabase.from('trades').select('*', { count: 'exact' }).eq('user_id', params.userId);
  if (params.assetType && params.assetType.length > 0) query = query.in('asset_type', params.assetType);
  if (params.side && params.side.length > 0) query = query.in('side', params.side);
  if (params.symbol) query = query.ilike('symbol', `%${params.symbol}%`);
  if (params.dateFrom) query = query.gte('opened_at', params.dateFrom);
  if (params.dateTo) query = query.lte('opened_at', params.dateTo);
  if (params.sort && params.sort.field) {
    query = query.order(params.sort.field, { ascending: params.sort.dir === 'asc' });
  } else {
    query = query.order('opened_at', { ascending: false });
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  const { data, count, error } = await query;
  if (error) throw error;
  // Normalize, compute realized PnL for each row
  const rows: Trade[] = (data as any[]).map(normalizeTrade);
  return { rows, total: count ?? 0, page, pageSize };
}

export function computeRealizedPnl(trade: Trade): { pnl: number; pnlPct: number } {
  if (trade.status !== 'closed' || trade.closePrice == null) return { pnl: 0, pnlPct: 0 };
  let pnl = 0, denom = 0;
  switch (trade.assetType) {
    case 'stock': {
      const side = (trade.side ?? 'buy').toLowerCase();
      pnl = ((side === 'buy' ? 1 : -1) * ((trade.closePrice ?? 0) - trade.openPrice) * Math.abs(trade.quantity)) - (trade.fees || 0);
      denom = Math.abs(trade.openPrice * trade.quantity);
      break;
    }
    case 'option': {
      const multiplier = (trade as any).multiplier ?? 100;
      pnl = ((trade.closePrice ?? 0) - trade.openPrice) * Math.abs(trade.quantity) * multiplier - (trade.fees || 0);
      denom = Math.abs(trade.openPrice * trade.quantity * multiplier);
      break;
    }
    case 'futures': {
      const pointValue = (trade as any).pointValue ?? 1;
      pnl = ((trade.closePrice ?? 0) - trade.openPrice) * pointValue * Math.abs(trade.quantity) - (trade.fees || 0);
      denom = Math.abs(trade.openPrice * pointValue * trade.quantity);
      break;
    }
    case 'crypto': {
      pnl = ((trade.closePrice ?? 0) - trade.openPrice) * Math.abs(trade.quantity) - (trade.fees || 0);
      denom = Math.abs(trade.openPrice * trade.quantity);
      break;
    }
    default: {
      pnl = 0; denom = 0;
    }
  }
  const pnlPct = denom > 0 ? (100 * pnl) / denom : 0;
  return { pnl, pnlPct };
}

function normalizeTrade(raw: any): Trade {
  // Turn DB row into normalized Trade type
  const common = {
    id: raw.id || '',
    userId: raw.user_id,
    assetType: raw.asset_type,
    symbol: raw.symbol,
    side: raw.side,
    quantity: Number(raw.quantity),
    openPrice: Number(raw.open_price),
    closePrice: raw.close_price ? Number(raw.close_price) : null,
    fees: raw.fees ? Number(raw.fees) : 0,
    openedAt: raw.opened_at,
    closedAt: raw.closed_at,
    status: raw.status,
    notes: raw.notes,
    tags: raw.tags ?? [],
  };
  switch (raw.asset_type) {
    case 'option':
      return {
        ...common,
        assetType: 'option',
        optionType: raw.option_type,
        strike: Number(raw.strike),
        expiration: raw.expiration,
        multiplier: raw.multiplier ? Number(raw.multiplier) : 100,
      };
    case 'futures':
      return {
        ...common,
        assetType: 'futures',
        contractCode: raw.contract_code,
        expiration: raw.expiration,
        pointValue: Number(raw.point_value),
        tickSize: raw.tick_size ? Number(raw.tick_size) : null,
        tickValue: raw.tick_value ? Number(raw.tick_value) : null,
      };
    case 'crypto':
      return {
        ...common,
        assetType: 'crypto',
        quoteCurrency: raw.quote_currency,
      };
    default:
      return { ...common };
  }
}
