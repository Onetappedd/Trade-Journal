// frontend/app/api/trades/route.ts
import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getTrades, type TradeListParams } from '@/lib/trades-server';

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
    
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('GET /api/trades - Missing environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Missing Supabase environment variables'
      }, { status: 500 });
    }
    
    const userId = await getUserIdFromRequest();
    console.log('GET /api/trades - User ID:', userId);
    
    if (!userId) {
      console.log('GET /api/trades - Unauthorized: No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const params = parseParams(url);
    console.log('GET /api/trades - Params:', params);
    
    const result = await getTrades({ ...params, userId });
    console.log('GET /api/trades - Result rows count:', result.rows.length);
    
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/trades error:', err);
    console.error('GET /api/trades error stack:', err instanceof Error ? err.stack : 'No stack trace');
    
    // Return more specific error information
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const isAuthError = errorMessage.includes('auth') || errorMessage.includes('user');
    const isDbError = errorMessage.includes('database') || errorMessage.includes('connection');
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: errorMessage,
      type: isAuthError ? 'authentication' : isDbError ? 'database' : 'unknown'
    }, { status: 500 });
  }
}
