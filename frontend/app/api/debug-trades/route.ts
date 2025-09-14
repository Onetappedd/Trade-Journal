import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    // Get all user trades - same query as analytics API
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      userId: user.id,
      tradesCount: trades?.length || 0,
      trades: trades?.map(t => ({
        id: t.id,
        symbol: t.symbol,
        status: t.status,
        realized_pnl: t.realized_pnl,
        opened_at: t.opened_at,
        closed_at: t.closed_at
      })) || []
    });
  } catch (error: any) {
    console.error('Debug trades API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
