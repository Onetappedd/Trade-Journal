import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('GET /api/trades/test - Starting test request');
    
    // Test 1: Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('GET /api/trades/test - Env vars check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      }, { status: 500 });
    }
    
    // Test 2: Check authentication
    const userId = await getUserIdFromRequest();
    console.log('GET /api/trades/test - User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized - No user ID found',
        authStatus: 'failed'
      }, { status: 401 });
    }
    
    // Test 3: Check database connection
    const supabase = await createClient();
    console.log('GET /api/trades/test - Testing database connection');
    
    const { data, error } = await supabase
      .from('trades')
      .select('count', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      console.error('GET /api/trades/test - Database error:', error);
      return NextResponse.json({ 
        error: 'Database connection failed',
        dbError: error.message,
        authStatus: 'success',
        userId
      }, { status: 500 });
    }
    
    console.log('GET /api/trades/test - Database connection successful');
    
    // Test 4: Get actual trades count
    const { data: tradesData, error: tradesError, count } = await supabase
      .from('trades')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(5);
    
    if (tradesError) {
      console.error('GET /api/trades/test - Trades query error:', tradesError);
      return NextResponse.json({ 
        error: 'Trades query failed',
        tradesError: tradesError.message,
        authStatus: 'success',
        dbStatus: 'connected',
        userId
      }, { status: 500 });
    }
    
    console.log('GET /api/trades/test - Trades query successful');
    
    return NextResponse.json({
      success: true,
      authStatus: 'success',
      dbStatus: 'connected',
      userId,
      totalTrades: count || 0,
      sampleTrades: tradesData?.length || 0,
      sampleTrade: tradesData?.[0] ? {
        id: tradesData[0].id,
        symbol: tradesData[0].symbol,
        asset_type: tradesData[0].asset_type,
        side: tradesData[0].side
      } : null
    });
    
  } catch (err) {
    console.error('GET /api/trades/test - Unexpected error:', err);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 500 });
  }
}
