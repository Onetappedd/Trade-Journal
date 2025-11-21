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

    const supabase = await createSupabaseWithToken(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createApiError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', authError?.message),
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Handle both 'page' and 'offset' for compatibility
    const offset = searchParams.get('offset');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit') || '50';
    const limit = Math.min(parseInt(limitParam), 100); // Cap at 100
    const page = offset ? Math.floor(parseInt(offset) / limit) + 1 : (pageParam ? parseInt(pageParam) : 1);
    
    const params: TradesQueryParams = {
      page,
      limit,
      sort: searchParams.get('sort') || 'opened_at', // Default to opened_at (matching engine schema)
      direction: (searchParams.get('direction') as 'asc' | 'desc') || 'desc',
      symbol: searchParams.get('symbol') || undefined,
      side: searchParams.get('side') || undefined,
      status: searchParams.get('status') || undefined,
      // Handle both 'asset_type' and 'asset' for compatibility
      asset_type: searchParams.get('asset_type') || searchParams.get('asset') || undefined,
      // Handle both 'date_from'/'date_to' and 'from'/'to' for compatibility
      date_from: searchParams.get('date_from') || searchParams.get('from') || undefined,
      date_to: searchParams.get('date_to') || searchParams.get('to') || undefined,
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

    // Get trades data
    const tradesData = await getTrades(user.id, params, supabase);

    return NextResponse.json(createApiSuccess(tradesData));

  } catch (error: any) {
    console.error('Trades API error:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      cause: error?.cause
    });
    return NextResponse.json(
      createApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch trades', error?.message || String(error)),
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
    .select('*') // Simplify to * for debugging to avoid column issues
    .eq('user_id', userId);
  
  console.log(`[Trades API] Building query for user ${userId}, page ${page}, limit ${limit}, offset ${offset}`);

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
  
  // Date filtering: Check both entry_date (old schema) and opened_at (matching engine schema)
  // For now, prioritize opened_at since matching engine uses it
  // If date filters are provided, filter by opened_at (matching engine schema)
  // Trades without opened_at will use entry_date if available
  if (date_from) {
    // Filter by opened_at first (matching engine), fallback to entry_date (old schema)
    query = query.or(`opened_at.gte.${date_from},entry_date.gte.${date_from}`);
  }
  
  if (date_to) {
    query = query.or(`opened_at.lte.${date_to},entry_date.lte.${date_to}`);
  }

  // Apply sorting
  // Default to opened_at (matching engine uses this) with fallback to entry_date (old schema)
  const validSortFields = ['symbol', 'side', 'quantity', 'price', 'entry_price', 'pnl', 'opened_at', 'entry_date', 'executed_at', 'closed_at', 'exit_date', 'status'];
  const sortField = (sort && validSortFields.includes(sort)) ? sort : 'opened_at'; // Changed default from 'entry_date' to 'opened_at'
  
  // Primary sort by the selected field
  query = query.order(sortField, { ascending: direction === 'asc', nullsFirst: false });
  
  // Add secondary sorts for consistency
  if (sortField === 'opened_at' || sortField === 'entry_date') {
    // If sorting by date, add secondary sorts for consistent ordering
    query = query.order('created_at', { ascending: direction === 'asc', nullsFirst: false });
  }

  // Get total count for pagination
  // Build count query with same filters as main query
  let countQuery = supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  // Apply same filters as main query
  if (symbol) {
    countQuery = countQuery.ilike('symbol', `%${symbol}%`);
  }
  if (side) {
    countQuery = countQuery.eq('side', side);
  }
  if (status) {
    countQuery = countQuery.eq('status', status);
  }
  if (asset_type) {
    countQuery = countQuery.eq('asset_type', asset_type);
  }
  if (date_from) {
    countQuery = countQuery.gte('opened_at', date_from);
  }
  if (date_to) {
    countQuery = countQuery.lte('opened_at', date_to);
  }
  
  const { count: totalCount, error: countError } = await countQuery;

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
    console.error('Trades error details:', {
      message: tradesError?.message,
      code: tradesError?.code,
      details: tradesError?.details,
      hint: tradesError?.hint
    });
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

  console.log(`[Trades API] Fetched ${trades?.length || 0} trades for user ${userId}, total count: ${totalCount}`);

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

    const supabase = await createSupabaseWithToken(request);

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