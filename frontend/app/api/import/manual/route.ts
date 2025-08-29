import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { matchUserTrades } from '@/lib/matching/engine';
import { resolveInstrument } from '@/lib/instruments/resolve';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['instrument_type', 'symbol', 'side', 'quantity', 'price', 'fees', 'timestamp', 'currency', 'venue'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate option-specific fields
    if (body.instrument_type === 'option') {
      const optionFields = ['expiry', 'strike', 'option_type', 'underlying'];
      for (const field of optionFields) {
        if (!body[field]) {
          return NextResponse.json({ error: `Options require ${field}` }, { status: 400 });
        }
      }
    }

    // Create import run
    const { data: importRun, error: runError } = await supabase
      .from('import_runs')
      .insert({
        user_id: user.id,
        broker_account_id: null, // Manual entries don't have a broker account
        source: 'manual',
        status: 'processing',
        started_at: new Date().toISOString(),
        summary: {
          manual_entry: true,
          instrument_type: body.instrument_type,
          symbol: body.symbol
        }
      })
      .select()
      .single();

    if (runError) {
      console.error('Error creating import run:', runError);
      return NextResponse.json({ error: 'Failed to create import run' }, { status: 500 });
    }

    // Normalize the data
    const normalizedData = {
      timestamp: new Date(body.timestamp).toISOString(),
      symbol: body.symbol.toUpperCase().trim(),
      side: body.side.toLowerCase(),
      quantity: parseFloat(body.quantity),
      price: parseFloat(body.price),
      fees: parseFloat(body.fees),
      currency: body.currency.toUpperCase(),
      venue: body.venue,
      order_id: body.order_id || null,
      exec_id: body.exec_id || null,
      instrument_type: body.instrument_type,
      expiry: body.expiry ? new Date(body.expiry).toISOString().split('T')[0] : undefined,
      strike: body.strike ? parseFloat(body.strike) : undefined,
      option_type: body.option_type || undefined,
      multiplier: body.multiplier ? parseFloat(body.multiplier) : undefined,
      underlying: body.underlying ? body.underlying.toUpperCase().trim() : undefined,
    };

    // Create raw import item
    const { data: rawItem, error: rawError } = await supabase
      .from('raw_import_items')
      .insert({
        import_run_id: importRun.id,
        user_id: user.id,
        source_line: 1, // Manual entries are always line 1
        raw_payload: body,
        status: 'parsed'
      })
      .select()
      .single();

    if (rawError) {
      console.error('Error creating raw import item:', rawError);
      return NextResponse.json({ error: 'Failed to create raw import item' }, { status: 500 });
    }

    // Resolve instrument
    let instrumentId = null;
    try {
      const instrumentResult = await resolveInstrument({
        symbol: normalizedData.symbol,
        occ_symbol: undefined,
        futures_symbol: undefined,
        expiry: normalizedData.expiry,
        strike: normalizedData.strike,
        option_type: normalizedData.option_type,
        underlying: normalizedData.underlying,
        instrument_type: normalizedData.instrument_type,
        venue: normalizedData.venue
      });
      instrumentId = instrumentResult.instrument_id;
    } catch (error) {
      console.warn('Failed to resolve instrument:', error);
      // Continue without instrument resolution
    }

    // Create execution
    const { data: execution, error: execError } = await supabase
      .from('executions_normalized')
      .insert({
        user_id: user.id,
        import_run_id: importRun.id,
        instrument_id: instrumentId,
        timestamp: normalizedData.timestamp,
        symbol: normalizedData.symbol,
        side: normalizedData.side,
        quantity: normalizedData.quantity,
        price: normalizedData.price,
        fees: normalizedData.fees,
        currency: normalizedData.currency,
        venue: normalizedData.venue,
        order_id: normalizedData.order_id,
        exec_id: normalizedData.exec_id,
        instrument_type: normalizedData.instrument_type,
        expiry: normalizedData.expiry,
        strike: normalizedData.strike,
        option_type: normalizedData.option_type,
        multiplier: normalizedData.multiplier,
        underlying: normalizedData.underlying,
        unique_hash: `manual_${user.id}_${normalizedData.timestamp}_${normalizedData.symbol}_${normalizedData.side}_${normalizedData.quantity}_${normalizedData.price}`
      })
      .select()
      .single();

    if (execError) {
      console.error('Error creating execution:', execError);
      return NextResponse.json({ error: 'Failed to create execution' }, { status: 500 });
    }

    // Update raw import item with execution ID
    await supabase
      .from('raw_import_items')
      .update({ execution_id: execution.id })
      .eq('id', rawItem.id);

    // Run matching engine
    try {
      const matchResult = await matchUserTrades({ 
        userId: user.id, 
        sinceImportRunId: importRun.id 
      });
      console.log('Matching result:', matchResult);
    } catch (error) {
      console.error('Error running matching engine:', error);
      // Don't fail the request if matching fails
    }

    // Update import run status
    await supabase
      .from('import_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        summary: {
          ...importRun.summary,
          added: 1,
          total: 1,
          execution_id: execution.id
        }
      })
      .eq('id', importRun.id);

    return NextResponse.json({
      runId: importRun.id,
      executionId: execution.id,
      message: 'Manual execution added successfully'
    });

  } catch (error) {
    console.error('Manual entry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
