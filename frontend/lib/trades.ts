import { createClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase';
import type { AssetType, TradeRow, TradesResponse } from '@/types/trade';

export type TradeListParams = {
  userId: string;
  page?: number;
  pageSize?: number;
  sort?: { field: string; dir: 'asc' | 'desc' };
  dateFrom?: string;
  dateTo?: string;
  assetTypes?: AssetType[];
  status?: Array<'open' | 'closed' | 'partial' | 'canceled'>;
  symbol?: string;
  text?: string;
};

export async function getTrades(params: TradeListParams): Promise<TradesResponse> {
  // Source: Supabase (see export logic)
  const supabase = createClient();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.max(1, Math.min(Number(params.pageSize) || 50, 200));
  let query = supabase.from('trades').select('*', { count: 'exact' }).eq('user_id', params.userId);
  if (params.assetTypes && params.assetTypes.length > 0) query = query.in('asset_type', params.assetTypes);
  if (params.status && params.status.length > 0) query = query.in('status', params.status);
  if (params.symbol) query = query.ilike('symbol', `%${params.symbol}%`);
  if (params.dateFrom) query = query.gte('entry_date', params.dateFrom);
  if (params.dateTo) query = query.lte('entry_date', params.dateTo);
  if (params.sort && params.sort.field) {
    query = query.order(params.sort.field, { ascending: params.sort.dir === 'asc' });
  } else {
    query = query.order('entry_date', { ascending: false });
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  const { data, count, error } = await query;
  if (error) throw error;
  return { items: data as TradeRow[], total: count ?? 0 };
}

export function computeRealizedPnl(trade: TradeRow): { pnl: number; pnlPct: number } {
  if (trade.status !== 'closed' || trade.exit_price == null) return { pnl: 0, pnlPct: 0 };
  let pnl = 0, denom = 0;
  switch (trade.asset_type) {
    case 'stock': {
      const side = (trade.side ?? 'buy').toLowerCase();
      pnl = ((side === 'buy' ? 1 : -1) * ((trade.exit_price ?? 0) - (trade.entry_price ?? 0)) * Math.abs(trade.quantity)) - (trade.fees || 0);
      denom = Math.abs((trade.entry_price ?? 0) * trade.quantity);
      break;
    }
    case 'option': {
      const multiplier = (trade as any).multiplier ?? 100;
      pnl = ((trade.exit_price ?? 0) - (trade.entry_price ?? 0)) * Math.abs(trade.quantity) * multiplier - (trade.fees || 0);
      denom = Math.abs((trade.entry_price ?? 0) * trade.quantity * multiplier);
      break;
    }
    case 'futures': {
      const pointValue = (trade as any).pointValue ?? 1;
      pnl = ((trade.exit_price ?? 0) - (trade.entry_price ?? 0)) * pointValue * Math.abs(trade.quantity) - (trade.fees || 0);
      denom = Math.abs((trade.entry_price ?? 0) * pointValue * trade.quantity);
      break;
    }
    case 'crypto': {
      pnl = ((trade.exit_price ?? 0) - (trade.entry_price ?? 0)) * Math.abs(trade.quantity) - (trade.fees || 0);
      denom = Math.abs((trade.entry_price ?? 0) * trade.quantity);
      break;
    }
    default: {
      pnl = 0; denom = 0;
    }
  }
  const pnlPct = denom > 0 ? (100 * pnl) / denom : 0;
  return { pnl, pnlPct };
}
