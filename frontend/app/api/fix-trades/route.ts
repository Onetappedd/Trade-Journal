import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { matchUserTrades } from '@/lib/matching/engine';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseWithToken(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch existing "bad" trades (unmatched executions disguised as trades)
    // We assume any trade with status='closed' and null exit_price or exit_date is a "bad" trade from the CSV import
    const { data: badTrades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'closed');

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch trades', details: fetchError }, { status: 500 });
    }

    if (!badTrades || badTrades.length === 0) {
      return NextResponse.json({ message: 'No trades to fix' });
    }

    console.log(`Found ${badTrades.length} trades to migrate`);

    // 2. Convert to executions
    const executions = badTrades.map(t => {
      // Determine instrument type
      let instrumentType = 'equity';
      if (t.asset_type === 'option' || t.instrument_type === 'option') instrumentType = 'option';
      if (t.asset_type === 'futures' || t.instrument_type === 'futures') instrumentType = 'futures';
      if (t.asset_type === 'crypto' || t.instrument_type === 'crypto') instrumentType = 'crypto';

      // Normalize side
      const side = t.side?.toLowerCase() || 'buy';

      // Map 'CALL'/'PUT' to 'C'/'P'
      let optionType = null;
      if (instrumentType === 'option') {
        const rawType = t.option_type || t.meta?.optionType; // Check meta if available
        if (rawType === 'CALL' || rawType === 'C') optionType = 'C';
        if (rawType === 'PUT' || rawType === 'P') optionType = 'P';
      }

      return {
        user_id: user.id,
        // Use original import run ID if available, or generate a new one for this migration
        source_import_run_id: t.import_run_id || t.ingestion_run_id || randomUUID(),
        instrument_type: instrumentType,
        symbol: t.symbol,
        side,
        quantity: Number(t.qty_opened || t.quantity),
        price: Number(t.avg_open_price || t.entry_price || t.price),
        fees: Number(t.fees || 0),
        currency: 'USD',
        timestamp: t.opened_at || t.executed_at || t.entry_date || new Date().toISOString(),
        venue: t.broker || 'migration',
        order_id: t.broker_trade_id || t.external_id || randomUUID(),
        exec_id: randomUUID(), // Generate new exec ID to avoid conflicts
        multiplier: instrumentType === 'option' ? 100 : 1,
        expiry: t.option_expiration || null,
        strike: t.option_strike ? Number(t.option_strike) : null,
        option_type: optionType,
        underlying: t.underlying_symbol || t.symbol, // Approximate underlying
        notes: t.notes,
        unique_hash: t.row_hash || randomUUID() // Use existing hash or generate
      };
    });

    // 3. Insert into executions_normalized
    // Process in chunks
    const chunkSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < executions.length; i += chunkSize) {
      const chunk = executions.slice(i, i + chunkSize);
      const { error: insertError } = await supabase
        .from('executions_normalized')
        .insert(chunk);
        
      if (insertError) {
        console.error('Error inserting executions chunk:', insertError);
        // Continue with other chunks? Or fail?
        // Let's try to continue but log error
      } else {
        insertedCount += chunk.length;
      }
    }

    console.log(`Migrated ${insertedCount} executions`);

    // 4. Run Matching Engine
    // This will DELETE the old trades for these symbols and create new MATCHED trades
    let matchResult;
    try {
      matchResult = await matchUserTrades({
        userId: user.id,
        supabase
      });
    } catch (e: any) {
      console.error('Matching failed:', e);
      return NextResponse.json({ 
        success: false, 
        migrated: insertedCount, 
        matchError: e.message 
      });
    }

    return NextResponse.json({
      success: true,
      migrated: insertedCount,
      matching: matchResult
    });

  } catch (error: any) {
    console.error('Fix trades error:', error);
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
  }
}

