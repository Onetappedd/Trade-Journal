import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { ImportRun } from '../../../../../lib/types/imports';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServerSupabase();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the specific import run
    const { data: importRun, error } = await supabase
      .from('import_runs')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Import run not found' }, { status: 404 });
      }
      console.error('Error fetching import run:', error);
      return NextResponse.json({ error: 'Failed to fetch import run' }, { status: 500 });
    }

    // Get items summary
    const { data: itemsSummary, error: summaryError } = await supabase
      .from('raw_import_items')
      .select('status')
      .eq('import_run_id', params.id);

    if (summaryError) {
      console.error('Error fetching items summary:', summaryError);
      // Don't fail the request if summary fails
    }

    // Calculate summary counts
    const summary = {
      added: itemsSummary?.filter(item => item.status === 'parsed').length || 0,
      duplicates: itemsSummary?.filter(item => item.status === 'duplicate').length || 0,
      errors: itemsSummary?.filter(item => item.status === 'error').length || 0,
      retried: itemsSummary?.filter(item => item.status === 'retried').length || 0,
      total: itemsSummary?.length || 0
    };

    return NextResponse.json({
      run: importRun,
      itemsSummary: summary
    });

  } catch (error) {
    console.error('Unexpected error in import run API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
