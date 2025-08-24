import { createClient } from '@/lib/supabase-server';
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
  try {
    console.log('getTrades - Starting with params:', { ...params, userId: params.userId ? 'present' : 'missing' });
    
    // Source: Supabase (see export logic)
    const supabase = createClient();
    console.log('getTrades - Supabase client created');
    
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.max(1, Math.min(Number(params.pageSize) || 50, 200));
    
    console.log('getTrades - Building query for user:', params.userId);
    
    // Start with a basic query to test the table structure
    let query = supabase.from('trades').select('*', { count: 'exact' });
    
    // Add user filter
    query = query.eq('user_id', params.userId);
    
    // Add optional filters
    if (params.assetType && params.assetType.length > 0) {
      console.log('getTrades - Adding asset type filter:', params.assetType);
      query = query.in('asset_type', params.assetType);
    }
    if (params.side && params.side.length > 0) {
      console.log('getTrades - Adding side filter:', params.side);
      query = query.in('side', params.side);
    }
    if (params.symbol) {
      console.log('getTrades - Adding symbol filter:', params.symbol);
      query = query.ilike('symbol', `%${params.symbol}%`);
    }
    if (params.dateFrom) {
      console.log('getTrades - Adding date from filter:', params.dateFrom);
      query = query.gte('opened_at', params.dateFrom);
    }
    if (params.dateTo) {
      console.log('getTrades - Adding date to filter:', params.dateTo);
      query = query.lte('opened_at', params.dateTo);
    }
    
    // Add sorting
    if (params.sort && params.sort.field) {
      console.log('getTrades - Adding sort:', params.sort);
      query = query.order(params.sort.field, { ascending: params.sort.dir === 'asc' });
    } else {
      console.log('getTrades - Using default sort by opened_at desc');
      query = query.order('opened_at', { ascending: false });
    }
    
    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    console.log('getTrades - Adding range:', { from, to });
    query = query.range(from, to);
    
    console.log('getTrades - Executing query');
    const { data, count, error } = await query;
    
    if (error) {
      console.error('getTrades - Supabase error:', error);
      console.error('getTrades - Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('getTrades - Query successful, data count:', data?.length || 0);
    
    // Safely normalize the data
    const rows: Trade[] = [];
    if (data && Array.isArray(data)) {
      for (const item of data) {
        try {
          const normalized = normalizeTrade(item);
          rows.push(normalized);
        } catch (normalizeError) {
          console.error('getTrades - Error normalizing trade:', normalizeError, 'Raw data:', item);
          // Continue with other trades instead of failing completely
        }
      }
    }
    
    console.log('getTrades - Normalized rows count:', rows.length);
    
    const result = { rows, total: count ?? 0, page, pageSize };
    console.log('getTrades - Returning result:', { rowsCount: result.rows.length, total: result.total, page: result.page, pageSize: result.pageSize });
    
    return result;
  } catch (err) {
    console.error('getTrades - Unexpected error:', err);
    if (err instanceof Error) {
      console.error('getTrades - Error message:', err.message);
      console.error('getTrades - Error stack:', err.stack);
    }
    throw err;
  }
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
  try {
    // Validate required fields
    if (!raw.id) {
      throw new Error('Trade missing required field: id');
    }
    if (!raw.user_id) {
      throw new Error('Trade missing required field: user_id');
    }
    if (!raw.asset_type) {
      throw new Error('Trade missing required field: asset_type');
    }
    if (!raw.symbol) {
      throw new Error('Trade missing required field: symbol');
    }
    
    // Turn DB row into normalized Trade type with safe defaults
    const common = {
      id: String(raw.id),
      userId: String(raw.user_id),
      assetType: String(raw.asset_type),
      symbol: String(raw.symbol),
      side: raw.side || 'buy',
      quantity: Number(raw.quantity) || 0,
      openPrice: Number(raw.open_price) || 0,
      closePrice: raw.close_price ? Number(raw.close_price) : null,
      fees: raw.fees ? Number(raw.fees) : 0,
      openedAt: raw.opened_at || new Date().toISOString(),
      closedAt: raw.closed_at || null,
      status: raw.status || 'open',
      notes: raw.notes || null,
      tags: Array.isArray(raw.tags) ? raw.tags : [],
    };

    // Compute realized PnL
    const { pnl, pnlPct } = computeRealizedPnl({
      ...common,
      closePrice: raw.close_price ? Number(raw.close_price) : null,
      assetType: raw.asset_type,
    } as Trade);

    const tradeWithPnl = {
      ...common,
      realizedPnl: pnl,
      realizedPnlPct: pnlPct,
    };

    // Return specific trade type based on asset_type
    switch (raw.asset_type) {
      case 'stock':
      case 'crypto':
        return tradeWithPnl as Trade;
      case 'option':
        return {
          ...tradeWithPnl,
          assetType: 'option',
          optionType: raw.option_type || 'call',
          strike: Number(raw.strike) || 0,
          expiration: raw.expiration || '',
          multiplier: raw.multiplier ? Number(raw.multiplier) : 100,
        };
      case 'futures':
        return {
          ...tradeWithPnl,
          assetType: 'futures',
          contractCode: raw.contract_code || '',
          expiration: raw.expiration || '',
          pointValue: Number(raw.point_value) || 1,
          tickSize: raw.tick_size ? Number(raw.tick_size) : null,
          tickValue: raw.tick_value ? Number(raw.tick_value) : null,
        };
      default:
        console.warn('normalizeTrade - Unknown asset type:', raw.asset_type, 'Treating as stock');
        return tradeWithPnl as Trade;
    }
  } catch (error) {
    console.error('normalizeTrade - Error normalizing trade:', error, 'Raw data:', raw);
    throw error;
  }
}
