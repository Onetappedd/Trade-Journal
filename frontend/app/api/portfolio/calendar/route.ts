import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';

interface CalendarMetrics {
  date: string;
  pnl: number;
  trades: number;
  volume: number;
}

/**
 * Portfolio Calendar API
 * Provides P&L and trade metrics by date for calendar display
 * Replaces heavy client-side computation with server-side aggregation
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createSupabaseWithToken(token);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const year = searchParams.get('year');

    // Build query with only required fields
    let query = supabase
      .from('trades')
      .select('id, pnl, opened_at, closed_at, quantity, price')
      .eq('user_id', user.id);

    if (startDate) {
      query = query.gte('opened_at', startDate);
    }
    if (endDate) {
      query = query.lte('opened_at', endDate);
    }
    if (year) {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      query = query.gte('opened_at', yearStart).lte('opened_at', yearEnd);
    }

    const { data: trades, error: tradesError } = await query;

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return NextResponse.json({ error: 'Failed to fetch trades', details: tradesError.message }, { status: 500 });
    }

    if (!trades || trades.length === 0) {
      return NextResponse.json([]);
    }

    // Group trades by date
    const dateMap = new Map<string, { pnl: number; trades: number; volume: number }>();
    
    trades.forEach(trade => {
      // Use closed_at if available, otherwise opened_at
      const tradeDate = trade.closed_at || trade.opened_at;
      const date = new Date(tradeDate).toISOString().split('T')[0];
      
      if (!dateMap.has(date)) {
        dateMap.set(date, { pnl: 0, trades: 0, volume: 0 });
      }
      
      const dayData = dateMap.get(date)!;
      dayData.pnl += trade.pnl || 0;
      dayData.trades += 1;
      dayData.volume += (trade.quantity || 0) * (trade.price || 0);
    });

    // Convert to array and sort by date
    const calendarData: CalendarMetrics[] = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        pnl: data.pnl,
        trades: data.trades,
        volume: data.volume
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(calendarData);

  } catch (error: any) {
    console.error('Portfolio calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
