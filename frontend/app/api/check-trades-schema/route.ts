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
    
    // Get table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'trades')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('Error getting table structure:', columnsError);
      return NextResponse.json({ 
        error: 'Failed to get table structure', 
        details: columnsError.message 
      }, { status: 500 });
    }
    
    console.log('Trades table columns:', columns);
    
    // Try to get a sample record to see what columns exist
    const { data: sampleTrades, error: sampleError } = await supabase
      .from('trades')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error getting sample trades:', sampleError);
      return NextResponse.json({ 
        error: 'Failed to get sample trades', 
        details: sampleError.message 
      }, { status: 500 });
    }
    
    console.log('Sample trades:', sampleTrades);
    
    return NextResponse.json({
      success: true,
      columns: columns,
      sampleTrades: sampleTrades,
      message: 'Trades table schema retrieved successfully'
    });

  } catch (error: any) {
    console.error('Check trades schema error:', error);
    return NextResponse.json({ 
      error: 'Schema check failed', 
      details: error.message 
    }, { status: 500 });
  }
}
