import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const supabase = await createSupabaseWithToken(request);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    const { runId } = await request.json();

    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 });
    }

    // Delete trades associated with this import run
    const { data: trades, error: deleteTradesError } = await supabase
      .from('trades')
      .delete()
      .eq('user_id', user.id)
      .eq('import_run_id', runId)
      .select('id');

    if (deleteTradesError) {
      console.error('Error deleting trades:', deleteTradesError);
      return NextResponse.json({ error: 'Failed to delete trades', details: deleteTradesError.message }, { status: 500 });
    }

    // Delete executions associated with this import run
    const { error: deleteExecutionsError } = await supabase
      .from('executions_normalized')
      .delete()
      .eq('user_id', user.id)
      .eq('source_import_run_id', runId);

    if (deleteExecutionsError) {
      console.error('Error deleting executions:', deleteExecutionsError);
      return NextResponse.json({ error: 'Failed to delete executions', details: deleteExecutionsError.message }, { status: 500 });
    }

    const deletedCount = trades?.length || 0;

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully rolled back ${deletedCount} trades and associated executions`
    });
  } catch (error: any) {
    console.error('Rollback API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
