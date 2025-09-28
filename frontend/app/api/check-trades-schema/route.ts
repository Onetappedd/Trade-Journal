import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== CHECK TRADES SCHEMA START ===');
    
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
    
    // Try to get existing trades to see what columns are available
    const { data: existingTrades, error: existingError } = await supabase
      .from('trades')
      .select('*')
      .limit(1);
    
    if (existingError) {
      console.error('Error getting existing trades:', existingError);
      return NextResponse.json({ 
        error: 'Failed to get existing trades', 
        details: existingError.message 
      }, { status: 500 });
    }
    
    console.log('Existing trades:', existingTrades);
    
    return NextResponse.json({
      success: true,
      existingTrades: existingTrades,
      message: 'Trades table check completed'
    });

  } catch (error: any) {
    console.error('Check trades schema error:', error);
    return NextResponse.json({ 
      error: 'Schema check failed', 
      details: error.message 
    }, { status: 500 });
  }
}
