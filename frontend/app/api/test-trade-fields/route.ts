import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST TRADE FIELDS START ===');
    
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
    
    // Try different field name combinations
    const testCases = [
      {
        name: 'Basic fields only',
        data: {
          user_id: user.id,
          symbol: 'TEST1',
          side: 'buy',
          quantity: 1
        }
      },
      {
        name: 'With entry_price',
        data: {
          user_id: user.id,
          symbol: 'TEST2',
          side: 'buy',
          quantity: 1,
          entry_price: 100.00
        }
      },
      {
        name: 'With exit_price',
        data: {
          user_id: user.id,
          symbol: 'TEST3',
          side: 'buy',
          quantity: 1,
          entry_price: 100.00,
          exit_price: 105.00
        }
      },
      {
        name: 'With status',
        data: {
          user_id: user.id,
          symbol: 'TEST4',
          side: 'buy',
          quantity: 1,
          entry_price: 100.00,
          status: 'open'
        }
      },
      {
        name: 'With notes',
        data: {
          user_id: user.id,
          symbol: 'TEST5',
          side: 'buy',
          quantity: 1,
          entry_price: 100.00,
          notes: 'test trade'
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
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      results: results,
      message: 'Trade field tests completed'
    });

  } catch (error: any) {
    console.error('Test trade fields error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
