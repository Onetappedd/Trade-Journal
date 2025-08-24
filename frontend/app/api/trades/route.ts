// frontend/app/api/trades/route.ts
import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

function parseParams(url: URL): Omit<TradeListParams, 'userId'> {
  const page = Number(url.searchParams.get('page') ?? '1');
  const pageSize = Number(url.searchParams.get('pageSize') ?? '50');
  const accountId = url.searchParams.get('accountId') || undefined;
  const symbol = url.searchParams.get('symbol') || undefined;
  const dateFrom = url.searchParams.get('dateFrom') || undefined;
  const dateTo = url.searchParams.get('dateTo') || undefined;

  // allow multiple values
  const assetTypeParams = url.searchParams.getAll('assetType');
  const sideParams = url.searchParams.getAll('side');
  const assetType = assetTypeParams.length ? assetTypeParams : undefined;
  const side = sideParams.length ? sideParams : undefined;

  return { accountId, symbol, assetType, side, dateFrom, dateTo, page, pageSize };
}

export async function GET(req: Request) {
  try {
    console.log('GET /api/trades - Starting request');
    
    const userId = await getUserIdFromRequest();
    console.log('GET /api/trades - User ID:', userId);
    
    if (!userId) {
      console.log('GET /api/trades - Unauthorized: No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const params = parseParams(url);
    console.log('GET /api/trades - Params:', params);
    
    // Use the same approach as the working test endpoint
    const supabase = await createClient();
    
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.max(1, Math.min(Number(params.pageSize) || 50, 200));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    console.log('GET /api/trades - Building query with pagination:', { from, to });
    
    let query = supabase
      .from('trades')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('opened_at', { ascending: false })
      .range(from, to);
    
    // Add filters if provided
    if (params.assetType && params.assetType.length > 0) {
      query = query.in('asset_type', params.assetType);
    }
    if (params.side && params.side.length > 0) {
      query = query.in('side', params.side);
    }
    if (params.symbol) {
      query = query.ilike('symbol', `%${params.symbol}%`);
    }
    if (params.dateFrom) {
      query = query.gte('opened_at', params.dateFrom);
    }
    if (params.dateTo) {
      query = query.lte('opened_at', params.dateTo);
    }
    
    console.log('GET /api/trades - Executing query');
    const { data, count, error } = await query;
    
    if (error) {
      console.error('GET /api/trades - Query error:', error);
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message
      }, { status: 500 });
    }
    
    console.log('GET /api/trades - Query successful, data count:', data?.length || 0);
    
    // Return raw data for now to avoid normalization issues
    const result = {
      rows: data || [],
      total: count || 0,
      page,
      pageSize
    };
    
    console.log('GET /api/trades - Returning result:', { 
      rowsCount: result.rows.length, 
      total: result.total, 
      page: result.page, 
      pageSize: result.pageSize 
    });
    
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/trades error:', err);
    console.error('GET /api/trades error stack:', err instanceof Error ? err.stack : 'No stack trace');
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
