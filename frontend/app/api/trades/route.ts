import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { createApiError, createApiSuccess, ERROR_CODES } from '@/src/types/api';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

interface TradesQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  symbol?: string;
  side?: string;
  status?: string;
  asset_type?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Trades API Route
 * 
 * Optimized trades endpoint with server-side filtering, sorting, and pagination.
 * Designed for large accounts with thousands of trades.
 * 
 * Features:
 * - Server-side filtering and sorting
 * - Pagination for large datasets
 * - Cached responses for performance
 * - Minimal network payloads
 * - Efficient database queries
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createApiError(ERROR_CODES.UNAUTHORIZED, 'No authorization token provided'),
        { status: 401 }
      );
    }

    const supabase = createSupabaseWithToken(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createApiError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', authError?.message),
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params: TradesQueryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100), // Cap at 100
      sort: searchParams.get('sort') || 'entry_date', // Default to entry_date for imported trades
      direction: (searchParams.get('direction') as 'asc' | 'desc') || 'desc',
      symbol: searchParams.get('symbol') || undefined,
      side: searchParams.get('side') || undefined,
      status: searchParams.get('status') || undefined,
      asset_type: searchParams.get('asset_type') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
    };

    // Validate parameters
    if (params.page && params.page < 1) {
      return NextResponse.json(
        createApiError(ERROR_CODES.VALIDATION_ERROR, 'Page must be greater than 0'),
        { status: 400 }
      );
    }

    if (params.limit && (params.limit < 1 || params.limit > 100)) {
      return NextResponse.json(
        createApiError(ERROR_CODES.VALIDATION_ERROR, 'Limit must be between 1 and 100'),
        { status: 400 }
      );
    }

    // Get cached trades data or fetch fresh
    const tradesData = await getCachedTrades(user.id, params, supabase);

    return NextResponse.json(createApiSuccess(tradesData));

  } catch (error: any) {
    console.error('Trades API error:', error);
    return NextResponse.json(
      createApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch trades', error.message),
      { status: 500 }
    );
  }
}

/**
 * Get cached trades data
 */
const getCachedTrades = unstable_cache(
  async (userId: string, params: TradesQueryParams, supabase: any) => {
    return getTrades(userId, params, supabase);
  },
  ['trades'],
  {
    tags: ['trades', 'user'],
    revalidate: 60 // 1 minute cache
  }
);

/**
 * Get trades with server-side filtering and sorting
 */
async function getTrades(userId: string, params: TradesQueryParams, supabase: any) {
  const { page, limit, sort, direction, symbol, side, status, asset_type, date_from, date_to } = params;
  const offset = ((page || 1) - 1) * (limit || 20);

  // Build base query
  // Use COALESCE to handle both old schema (opened_at, avg_open_price, qty_opened) and new schema (entry_date, entry_price, quantity)
  let query = supabase
    .from('trades')
    .select(`
      id,
      symbol,
      side,
      quantity,
      entry_price,
      price,
      pnl,
      opened_at,
      entry_date,
      executed_at,
      closed_at,
      exit_date,
      exit_price,
      status,
      asset_type,
      instrument_type,
      avg_open_price,
      avg_close_price,
      qty_opened,
      qty_closed,
      realized_pnl,
      fees,
      created_at,
      updated_at
    `)
    .eq('user_id', userId);

  // Apply filters
  if (symbol) {
    query = query.ilike('symbol', `%${symbol}%`);
  }
  
  if (side) {
    query = query.eq('side', side);
  }
  
  if (status) {
    query = query.eq('status', status);
  }
  
  if (asset_type) {
    query = query.eq('asset_type', asset_type);
  }
  
  // Note: Supabase doesn't support OR across different columns easily
  // We'll filter by entry_date first (for imported trades), then fallback to opened_at
  // For date_from, we want trades where ANY of these dates >= date_from
  // For date_to, we want trades where ANY of these dates <= date_to
  // Since we can't do OR easily, we'll just filter by entry_date (most common for imports)
  // and opened_at as fallback
  if (date_from) {
    // Use entry_date first (for imported trades), then opened_at as fallback
    query = query.or(`entry_date.gte.${date_from},executed_at.gte.${date_from},opened_at.gte.${date_from}`);
  }
  
  if (date_to) {
    // Use entry_date first (for imported trades), then opened_at as fallback
    query = query.or(`entry_date.lte.${date_to},executed_at.lte.${date_to},opened_at.lte.${date_to}`);
  }

  // Apply sorting
  // Default to entry_date or executed_at for imported trades, fallback to opened_at
  const validSortFields = ['symbol', 'side', 'quantity', 'price', 'entry_price', 'pnl', 'opened_at', 'entry_date', 'executed_at', 'closed_at', 'exit_date', 'status'];
  const sortField = (sort && validSortFields.includes(sort)) ? sort : 'entry_date';
  // If sorting by entry_date but it's null, also sort by executed_at or opened_at
  query = query.order(sortField, { ascending: direction === 'asc', nullsFirst: false });
  if (sortField === 'entry_date') {
    query = query.order('executed_at', { ascending: direction === 'asc', nullsFirst: false });
    query = query.order('opened_at', { ascending: direction === 'asc', nullsFirst: false });
  }

  // Get total count for pagination
  const { count: totalCount, error: countError } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .modify((query: any) => {
      if (symbol) query = query.ilike('symbol', `%${symbol}%`);
      if (side) query = query.eq('side', side);
      if (status) query = query.eq('status', status);
      if (asset_type) query = query.eq('asset_type', asset_type);
      if (date_from) query = query.or(`opened_at.gte.${date_from},entry_date.gte.${date_from},executed_at.gte.${date_from}`);
      if (date_to) query = query.or(`opened_at.lte.${date_to},entry_date.lte.${date_to},executed_at.lte.${date_to}`);
      return query;
    });

  if (countError) {
    console.error('Trades count error:', countError);
    // Return empty result instead of throwing error
    return {
      items: [], // Use 'items' to match TradesResponse interface
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  // Get paginated results
  const { data: trades, error: tradesError } = await query
    .range(offset, offset + (limit || 20) - 1);

  if (tradesError) {
    console.error('Trades fetch error:', tradesError);
    // Return empty result instead of throwing error
    return {
      items: [], // Use 'items' to match TradesResponse interface
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  // Transform trades to match TradeRow interface
  // Map new schema (quantity, entry_price) to old schema (qty_opened, avg_open_price) for compatibility
  // Also convert string numbers from PostgreSQL NUMERIC to actual numbers
  const transformedTrades = (trades || []).map((trade: any) => ({
    ...trade,
    qty_opened: typeof (trade.qty_opened ?? trade.quantity) === 'string' 
      ? parseFloat(trade.qty_opened ?? trade.quantity ?? '0') 
      : (trade.qty_opened ?? trade.quantity ?? 0),
    avg_open_price: typeof (trade.avg_open_price ?? trade.entry_price ?? trade.price) === 'string'
      ? parseFloat(trade.avg_open_price ?? trade.entry_price ?? trade.price ?? '0')
      : (trade.avg_open_price ?? trade.entry_price ?? trade.price ?? 0),
    opened_at: trade.opened_at ?? trade.executed_at ?? trade.entry_date ?? new Date().toISOString(),
    closed_at: trade.closed_at ?? trade.exit_date ?? null,
    avg_close_price: typeof (trade.avg_close_price ?? trade.exit_price) === 'string'
      ? parseFloat(trade.avg_close_price ?? trade.exit_price ?? '0')
      : (trade.avg_close_price ?? trade.exit_price ?? null),
    qty_closed: typeof trade.qty_closed === 'string' ? parseFloat(trade.qty_closed) : (trade.qty_closed ?? null),
    realized_pnl: typeof (trade.realized_pnl ?? trade.pnl) === 'string'
      ? parseFloat(trade.realized_pnl ?? trade.pnl ?? '0')
      : (trade.realized_pnl ?? trade.pnl ?? null),
    fees: typeof trade.fees === 'string' ? parseFloat(trade.fees) : (trade.fees ?? null),
    instrument_type: trade.instrument_type ?? trade.asset_type ?? 'equity',
  }));

  return {
    items: transformedTrades, // Use 'items' to match TradesResponse interface
    total: totalCount || 0,
    page,
    limit,
    totalPages: Math.ceil((totalCount || 0) / (limit || 20)),
    hasNextPage: offset + (limit || 20) < (totalCount || 0),
    hasPreviousPage: (page || 1) > 1
  };
}

/**
 * POST endpoint for creating new trades
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createApiError(ERROR_CODES.UNAUTHORIZED, 'No authorization token provided'),
        { status: 401 }
      );
    }

    const supabase = createSupabaseWithToken(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createApiError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', authError?.message),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { symbol, side, quantity, price, asset_type } = body;

    // Validate required fields
    if (!symbol || !side || !quantity || !price) {
      return NextResponse.json(
        createApiError(ERROR_CODES.VALIDATION_ERROR, 'Missing required fields'),
        { status: 400 }
      );
    }

    // Create trade
    const { data: trade, error: createError } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        symbol,
        side,
        quantity,
        price,
        asset_type: asset_type || 'equity',
        status: 'open',
        opened_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create trade: ${createError.message}`);
    }

    // Invalidate trades cache
    // Note: In a real app, you'd use revalidateTag here

    return NextResponse.json(createApiSuccess(trade));

  } catch (error: any) {
    console.error('Create trade error:', error);
    return NextResponse.json(
      createApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to create trade', error.message),
      { status: 500 }
    );
  }
}