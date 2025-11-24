import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to inspect trades and executions
 * Helps diagnose why trades have 0 quantity/price
 */
export async function GET(request: NextRequest) {
  try {
    // Remove strict header check to allow cookie auth in browser
    const supabase = await createSupabaseWithToken(request);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sample of trades
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, symbol, qty_opened, avg_open_price, quantity, price, entry_price, instrument_type, status')
      .eq('user_id', user.id)
      .limit(10);

    // Get sample of executions
    const { data: executions, error: execsError } = await supabase
      .from('executions_normalized')
      .select('id, symbol, quantity, price, instrument_type, side, timestamp')
      .eq('user_id', user.id)
      .limit(10);

    // Count invalid trades
    const { count: invalidTradesCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .or('qty_opened.lte.0,avg_open_price.lte.0,quantity.lte.0,entry_price.lte.0,price.lte.0');

    // Count invalid executions
    const { data: allExecs } = await supabase
      .from('executions_normalized')
      .select('quantity, price')
      .eq('user_id', user.id);
    
    const invalidExecsCount = (allExecs || []).filter((e: any) => {
      const qty = typeof e.quantity === 'string' ? parseFloat(e.quantity) : (e.quantity || 0);
      const price = typeof e.price === 'string' ? parseFloat(e.price) : (e.price || 0);
      return !qty || qty <= 0 || !price || price <= 0;
    }).length;

    return NextResponse.json({
      trades: {
        sample: trades?.slice(0, 5),
        invalidCount: invalidTradesCount || 0,
        totalSample: trades?.length || 0,
      },
      executions: {
        sample: executions?.slice(0, 5),
        invalidCount: invalidExecsCount,
        totalSample: allExecs?.length || 0,
      },
      errors: {
        trades: tradesError?.message,
        executions: execsError?.message,
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

