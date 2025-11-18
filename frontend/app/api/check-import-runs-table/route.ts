import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { debugRouteGuard } from '@/lib/route-guards';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Guard: Only allow in development or when explicitly enabled
  const guardResponse = debugRouteGuard();
  if (guardResponse) return guardResponse;
  
  try {
    console.log('=== CHECK IMPORT_RUNS TABLE ===');
    
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if import_runs table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'import_runs');

    if (tableError) {
      console.error('Error checking table existence:', tableError);
      return NextResponse.json({ 
        error: 'Failed to check table existence', 
        details: tableError.message 
      }, { status: 500 });
    }

    console.log('Table exists check:', tableExists);

    if (!tableExists || tableExists.length === 0) {
      return NextResponse.json({ 
        error: 'import_runs table does not exist',
        suggestion: 'Run the SQL setup script in Supabase'
      }, { status: 500 });
    }

    // Get table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'import_runs')
      .order('ordinal_position');

    if (columnsError) {
      console.error('Error getting table structure:', columnsError);
      return NextResponse.json({ 
        error: 'Failed to get table structure', 
        details: columnsError.message 
      }, { status: 500 });
    }

    console.log('Table structure:', columns);

    // Check if we can insert a test record
    try {
      const { data: testInsert, error: insertError } = await supabase
        .from('import_runs')
        .insert({
          user_id: user.id,
          source: 'test',
          status: 'queued',
          file_name: 'test.csv',
          file_size: 1000,
          total_rows: 0,
          processed_rows: 0,
          progress: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('Test insert error:', insertError);
        return NextResponse.json({ 
          error: 'Failed to insert test record', 
          details: insertError.message,
          columns: columns
        }, { status: 500 });
      }

      // Clean up test record
      await supabase
        .from('import_runs')
        .delete()
        .eq('id', testInsert.id);

      console.log('Test insert successful');

      return NextResponse.json({
        success: true,
        message: 'import_runs table is working correctly',
        columns: columns
      });

    } catch (e) {
      console.error('Test insert failed:', e);
      return NextResponse.json({ 
        error: 'Test insert failed', 
        details: e.message,
        columns: columns
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('=== CHECK IMPORT_RUNS TABLE ERROR ===');
    console.error('Error:', error);
    
    return NextResponse.json({ 
      error: 'Check table failed', 
      details: error.message 
    }, { status: 500 });
  }
}
