import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST TRADE INSERT START ===');
    
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);
    
    // Test inserting a simple trade
    const testTrade = {
      user_id: user.id,
      symbol: 'TEST',
      side: 'buy',
      quantity: 1,
      entry_price: 100.00,
      exit_price: null,
      entry_date: '2025-01-01',
      exit_date: null,
      status: 'open',
      pnl: 0,
      broker: 'test',
      row_hash: `test_${Date.now()}`
    };
    
    console.log('Inserting test trade:', testTrade);
    
    const { data: insertData, error: insertError } = await supabase
      .from('trades')
      .insert(testTrade)
      .select();
    
    if (insertError) {
      console.error('Error inserting test trade:', insertError);
      return NextResponse.json({ 
        error: 'Failed to insert test trade', 
        details: insertError.message 
      }, { status: 500 });
    }
    
    console.log('Test trade inserted successfully:', insertData);
    
    // Clean up test trade
    await supabase
      .from('trades')
      .delete()
      .eq('id', insertData[0].id);
    
    console.log('Test trade cleaned up');
    
    return NextResponse.json({
      success: true,
      message: 'Test trade insertion successful',
      tradeId: insertData[0].id
    });

  } catch (error: any) {
    console.error('Test trade insert error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
