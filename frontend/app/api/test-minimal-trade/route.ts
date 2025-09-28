import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST MINIMAL TRADE START ===');
    
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
    
    // Try different minimal field combinations
    const testCases = [
      {
        name: 'Minimal fields only',
        data: {
          user_id: user.id,
          symbol: 'TEST1',
          side: 'buy',
          quantity: 1,
          price: 100.00
        }
      },
      {
        name: 'With broker field',
        data: {
          user_id: user.id,
          symbol: 'TEST2',
          side: 'buy',
          quantity: 1,
          price: 100.00,
          broker: 'test'
        }
      },
      {
        name: 'With pnl field',
        data: {
          user_id: user.id,
          symbol: 'TEST3',
          side: 'buy',
          quantity: 1,
          price: 100.00,
          pnl: 0
        }
      }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.name}`);
        console.log('Data:', testCase.data);
        
        const { data: insertData, error: insertError } = await supabase
          .from('trades')
          .insert(testCase.data)
          .select();
        
        if (insertError) {
          console.error(`Error with ${testCase.name}:`, insertError);
          results.push({
            name: testCase.name,
            success: false,
            error: insertError.message
          });
        } else {
          console.log(`Success with ${testCase.name}:`, insertData);
          results.push({
            name: testCase.name,
            success: true,
            data: insertData
          });
          
          // Clean up
          await supabase
            .from('trades')
            .delete()
            .eq('id', insertData[0].id);
        }
      } catch (e) {
        console.error(`Exception with ${testCase.name}:`, e);
        results.push({
          name: testCase.name,
          success: false,
          error: e.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      results: results,
      message: 'Minimal trade tests completed'
    });

  } catch (error: any) {
    console.error('Test minimal trade error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
