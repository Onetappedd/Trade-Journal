import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { withTelemetry } from '@/lib/observability/withTelemetry';
import { matchUserTrades } from '@/lib/matching/engine';

async function mergeInstrumentsHandler(request: NextRequest) {
  const supabase = getServerSupabase();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { sourceId, targetId } = await request.json();

  if (!sourceId || !targetId) {
    return NextResponse.json({ error: 'Source and target instrument IDs are required' }, { status: 400 });
  }

  if (sourceId === targetId) {
    return NextResponse.json({ error: 'Source and target instruments must be different' }, { status: 400 });
  }

  try {
    // Verify both instruments exist
    const { data: sourceInstrument, error: sourceError } = await supabase
      .from('instruments')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !sourceInstrument) {
      return NextResponse.json({ error: 'Source instrument not found' }, { status: 404 });
    }

    const { data: targetInstrument, error: targetError } = await supabase
      .from('instruments')
      .select('*')
      .eq('id', targetId)
      .single();

    if (targetError || !targetInstrument) {
      return NextResponse.json({ error: 'Target instrument not found' }, { status: 404 });
    }

    // Get execution counts for affected symbols
    const { data: sourceExecutions, error: execError } = await supabase
      .from('executions_normalized')
      .select('symbol')
      .eq('instrument_id', sourceId);

    if (execError) {
      console.error('Error fetching source executions:', execError);
      return NextResponse.json({ error: 'Failed to fetch execution data' }, { status: 500 });
    }

    const { data: targetExecutions } = await supabase
      .from('executions_normalized')
      .select('symbol')
      .eq('instrument_id', targetId);

    // Collect affected symbols
    const affectedSymbols = new Set<string>();
    sourceExecutions?.forEach(exec => affectedSymbols.add(exec.symbol));
    targetExecutions?.forEach(exec => affectedSymbols.add(exec.symbol));

    // Get alias counts
    const { data: sourceAliases, error: aliasError } = await supabase
      .from('instrument_aliases')
      .select('*')
      .eq('instrument_id', sourceId);

    if (aliasError) {
      console.error('Error fetching source aliases:', aliasError);
      return NextResponse.json({ error: 'Failed to fetch alias data' }, { status: 500 });
    }

    // Log merge operation
    console.log('Starting instrument merge:', {
      adminUserId: user.id,
      sourceId,
      sourceSymbol: sourceInstrument.symbol,
      targetId,
      targetSymbol: targetInstrument.symbol,
      sourceExecutionCount: sourceExecutions?.length || 0,
      sourceAliasCount: sourceAliases?.length || 0,
      affectedSymbols: Array.from(affectedSymbols),
      timestamp: new Date().toISOString()
    });

    // Perform merge in a transaction using RPC
    const { data: mergeResult, error: mergeError } = await supabase.rpc('merge_instruments', {
      p_source_id: sourceId,
      p_target_id: targetId,
      p_admin_user_id: user.id
    } as any);

    if (mergeError) {
      console.error('Merge transaction error:', mergeError);
      return NextResponse.json({ error: 'Failed to merge instruments' }, { status: 500 });
    }

    // Rebuild trades for affected symbols
    let tradeRebuildResult = { updatedTrades: 0, createdTrades: 0 };
    if (affectedSymbols.size > 0) {
      try {
        tradeRebuildResult = await matchUserTrades({
          userId: user.id,
          symbols: Array.from(affectedSymbols)
        });
      } catch (rebuildError) {
        console.error('Error rebuilding trades:', rebuildError);
        // Don't fail the merge if trade rebuilding fails
      }
    }

    const result = {
      executionsUpdated: mergeResult.executions_updated || 0,
      aliasesMoved: mergeResult.aliases_moved || 0,
      sourceDeleted: mergeResult.source_deleted || false,
      affectedSymbols: Array.from(affectedSymbols),
      tradeRebuild: tradeRebuildResult
    };

    // Log successful merge
    console.log('Instrument merge completed:', {
      adminUserId: user.id,
      sourceId,
      targetId,
      result,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Merge error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export with telemetry wrapper
export const POST = withTelemetry(mergeInstrumentsHandler, {
  route: '/api/admin/instruments/merge',
  redactFields: [],
});
