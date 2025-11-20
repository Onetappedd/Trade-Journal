import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { matchUserTrades } from '@/lib/matching/engine';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== 'riskr-fix-2025') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Get all trades that are potentially "bad" (status='closed' but missing exit data OR just all closed trades from imports)
    // We will re-process ALL closed trades to be safe.
    const { data: allTrades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('status', 'closed');

    if (fetchError) throw fetchError;
    if (!allTrades || allTrades.length === 0) return NextResponse.json({ message: 'No trades found' });

    console.log(`Found ${allTrades.length} trades to process`);

    // 2. Group by user_id
    const byUser: Record<string, any[]> = {};
    allTrades.forEach(t => {
      if (!byUser[t.user_id]) byUser[t.user_id] = [];
      byUser[t.user_id].push(t);
    });

    const results: Record<string, any> = {};

    // 3. Process each user
    for (const userId of Object.keys(byUser)) {
      const userTrades = byUser[userId];
      console.log(`Processing user ${userId}: ${userTrades.length} trades`);

      // Map to executions
      const executions = userTrades.map(t => {
        let instrumentType = 'equity';
        if (t.asset_type === 'option' || t.instrument_type === 'option') instrumentType = 'option';
        if (t.asset_type === 'futures' || t.instrument_type === 'futures') instrumentType = 'futures';
        if (t.asset_type === 'crypto' || t.instrument_type === 'crypto') instrumentType = 'crypto';

        // Map 'CALL'/'PUT' to 'C'/'P'
        let optionType = null;
        if (instrumentType === 'option') {
          const rawType = t.option_type || t.meta?.optionType;
          if (rawType === 'CALL' || rawType === 'C') optionType = 'C';
          if (rawType === 'PUT' || rawType === 'P') optionType = 'P';
        }

        return {
          user_id: userId,
          source_import_run_id: t.import_run_id || t.ingestion_run_id || randomUUID(),
          instrument_type: instrumentType,
          symbol: t.symbol,
          side: t.side?.toLowerCase() || 'buy',
          quantity: Number(t.qty_opened || t.quantity || 0),
          price: Number(t.avg_open_price || t.entry_price || t.price || 0),
          fees: Number(t.fees || 0),
          currency: 'USD',
          timestamp: t.opened_at || t.executed_at || t.entry_date || new Date().toISOString(),
          venue: t.broker || 'migration',
          order_id: t.broker_trade_id || t.external_id || randomUUID(),
          exec_id: randomUUID(),
          multiplier: instrumentType === 'option' ? 100 : 1,
          expiry: t.option_expiration || null,
          strike: t.option_strike ? Number(t.option_strike) : null,
          option_type: optionType,
          underlying: t.underlying_symbol || t.symbol,
          notes: t.notes,
          unique_hash: t.row_hash || randomUUID()
        };
      });

      // Insert into executions_normalized (ignore duplicates)
      // Process in chunks
      const chunkSize = 100;
      let insertedCount = 0;
      for (let i = 0; i < executions.length; i += chunkSize) {
        const chunk = executions.slice(i, i + chunkSize);
        const { error: insertError } = await supabase
          .from('executions_normalized')
          .upsert(chunk, { onConflict: 'unique_hash', ignoreDuplicates: true });
        
        if (insertError) {
          console.error(`Error inserting chunk for user ${userId}:`, insertError);
        } else {
          insertedCount += chunk.length;
        }
      }

      // Run Matching Engine
      try {
        const matchResult = await matchUserTrades({
          userId,
          supabase
        });
        results[userId] = { 
          migrated: insertedCount, 
          matched: matchResult 
        };
      } catch (matchError: any) {
        console.error(`Matching failed for user ${userId}:`, matchError);
        results[userId] = { error: matchError.message };
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error('Fix all trades error:', error);
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
  }
}

