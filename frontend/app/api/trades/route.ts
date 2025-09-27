import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { createApiError, createApiSuccess, ERROR_CODES } from '@/src/types/api';
import { unstable_cache } from 'next/cache';

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

    const token = authHeader.replace('Bearer ', '');
    const supabase = createSupabaseWithToken(token);

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
      sort: searchParams.get('sort') || 'opened_at',
      direction: (searchParams.get('direction') as 'asc' | 'desc') || 'desc',
      symbol: searchParams.get('symbol') || undefined,
      side: searchParams.get('side') || undefined,
      status: searchParams.get('status') || undefined,
      asset_type: searchParams.get('asset_type') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
    };

    // Validate parameters
    if (params.page < 1) {
      return NextResponse.json(
        createApiError(ERROR_CODES.VALIDATION_ERROR, 'Page must be greater than 0'),
        { status: 400 }
      );
    }

    if (params.limit < 1 || params.limit > 100) {
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
  const offset = (page - 1) * limit;

  // Build base query
  let query = supabase
    .from('trades')
    .select(`
      id,
      symbol,
      side,
      quantity,
      price,
      pnl,
      opened_at,
      closed_at,
      status,
      asset_type
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
  
  if (date_from) {
    query = query.gte('opened_at', date_from);
  }
  
  if (date_to) {
    query = query.lte('opened_at', date_to);
  }

  // Apply sorting
  const validSortFields = ['symbol', 'side', 'quantity', 'price', 'pnl', 'opened_at', 'closed_at', 'status'];
  const sortField = validSortFields.includes(sort) ? sort : 'opened_at';
  query = query.order(sortField, { ascending: direction === 'asc' });

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
      if (date_from) query = query.gte('opened_at', date_from);
      if (date_to) query = query.lte('opened_at', date_to);
      return query;
    });

  if (countError) {
    throw new Error(`Failed to get trades count: ${countError.message}`);
  }

  // Get paginated results
  const { data: trades, error: tradesError } = await query
    .range(offset, offset + limit - 1);

  if (tradesError) {
    throw new Error(`Failed to fetch trades: ${tradesError.message}`);
  }

  return {
    trades: trades || [],
    totalCount: totalCount || 0,
    page,
    limit,
    totalPages: Math.ceil((totalCount || 0) / limit),
    hasNextPage: offset + limit < (totalCount || 0),
    hasPreviousPage: page > 1
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

    const token = authHeader.replace('Bearer ', '');
    const supabase = createSupabaseWithToken(token);

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