import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST BASIC INSERT START ===');
    
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
    
    // Try the absolute minimum - just user_id
    try {
      console.log('Testing absolute minimum insert...');
      const { data: insertData, error: insertError } = await supabase
        .from('trades')
        .insert({
          user_id: user.id
        })
        .select();
      
      if (insertError) {
        console.error('Error with minimum insert:', insertError);
        return NextResponse.json({
          success: false,
          error: insertError.message,
          message: 'Even minimum insert failed'
        });
      } else {
        console.log('Success with minimum insert:', insertData);
        
        // Clean up
        await supabase
          .from('trades')
          .delete()
          .eq('id', insertData[0].id);
        
        return NextResponse.json({
          success: true,
          data: insertData,
          message: 'Minimum insert worked - checking what fields are available'
        });
      }
    } catch (e) {
      console.error('Exception with minimum insert:', e);
      return NextResponse.json({
        success: false,
        error: e.message,
        message: 'Minimum insert failed with exception'
      });
    }

  } catch (error: any) {
    console.error('Test basic insert error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
