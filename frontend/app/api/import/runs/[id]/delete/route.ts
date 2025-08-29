import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { matchUserTrades } from '@/lib/matching/engine';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServerSupabase();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runId = params.id;

    // Verify user owns this import run
    const { data: importRun, error: runError } = await supabase
      .from('import_runs')
      .select('id, user_id, summary')
      .eq('id', runId)
      .eq('user_id', user.id)
      .single();

    if (runError || !importRun) {
      return NextResponse.json({ error: 'Import run not found' }, { status: 404 });
    }

    // Get all executions from this import run
    const { data: executions, error: execError } = await supabase
      .from('executions_normalized')
      .select('id, symbol, instrument_type')
      .eq('import_run_id', runId)
      .eq('user_id', user.id);

    if (execError) {
      console.error('Error fetching executions:', execError);
      return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 });
    }

    // Collect affected symbols for trade rebuilding
    const affectedSymbols = new Set<string>();
    executions?.forEach(exec => {
      affectedSymbols.add(exec.symbol);
    });

    // Start database transaction
    const { error: transactionError } = await supabase.rpc('delete_import_run_cascade', {
      p_run_id: runId,
      p_user_id: user.id
    });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json({ error: 'Failed to delete import run' }, { status: 500 });
    }

    // Rebuild affected trades
    let affectedTrades = 0;
    if (affectedSymbols.size > 0) {
      try {
        const result = await matchUserTrades({ 
          userId: user.id, 
          symbols: Array.from(affectedSymbols) 
        });
        affectedTrades = result.updatedTrades + result.createdTrades;
      } catch (matchError) {
        console.error('Error rebuilding trades:', matchError);
        // Don't fail the delete operation if trade rebuilding fails
        // The trades can be rebuilt manually later
      }
    }

    return NextResponse.json({
      success: true,
      deletedExecutions: executions?.length || 0,
      affectedTrades,
      affectedSymbols: Array.from(affectedSymbols)
    });

  } catch (error) {
    console.error('Delete import run error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
