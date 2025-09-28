import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * Process All Matching Jobs API
 * Background job processor for handling matching jobs
 * Features:
 * - Processes all queued matching jobs
 * - Batch processing for efficiency
 * - Error handling and retry logic
 */
export async function POST(request: NextRequest) {
  try {
    // This should be called by a background job processor
    // For now, we'll process jobs directly
    const supabase = createSupabaseAdmin();

    // Get all queued matching jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('matching_jobs')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(10); // Process 10 jobs at a time

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No jobs to process',
        processed: 0 
      });
    }

    let processed = 0;
    let failed = 0;

    // Process each job
    for (const job of jobs) {
      try {
        // Update job status to processing
        await supabase
          .from('matching_jobs')
          .update({ 
            status: 'processing', 
            started_at: new Date().toISOString() 
          })
          .eq('id', job.id);

        // Get trades for this job
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', job.user_id)
          .eq('symbol', job.symbol)
          .gte('opened_at', `${job.date}T00:00:00.000Z`)
          .lt('opened_at', `${job.date}T23:59:59.999Z`)
          .order('opened_at', { ascending: true });

        if (tradesError) {
          throw new Error(`Failed to fetch trades: ${tradesError.message}`);
        }

        if (!trades || trades.length === 0) {
          await supabase
            .from('matching_jobs')
            .update({ 
              status: 'completed', 
              completed_at: new Date().toISOString(),
              result: { matched: 0, unmatched: 0, executions: 0 }
            })
            .eq('id', job.id);
          
          processed++;
          continue;
        }

        // Process trades and create executions
        const result = await processTradesForMatching(trades, job.user_id, supabase);

        // Update job status
        await supabase
          .from('matching_jobs')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString(),
            result: result
          })
          .eq('id', job.id);

        processed++;

      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        
        // Update job status to failed
        await supabase
          .from('matching_jobs')
          .update({ 
            status: 'failed', 
            completed_at: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', job.id);

        failed++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed, 
      failed,
      message: `Processed ${processed} jobs, ${failed} failed`
    });

  } catch (error: any) {
    console.error('Process all matching jobs error:', error);
    return NextResponse.json({ 
      error: 'Processing failed', 
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Process trades for matching and create executions
 */
async function processTradesForMatching(
  trades: any[], 
  userId: string, 
  supabase: any
): Promise<{ matched: number; unmatched: number; executions: number }> {
  let matched = 0;
  let unmatched = 0;
  let executions = 0;

  // Group trades by symbol and side
  const tradeGroups = new Map<string, any[]>();
  
  for (const trade of trades) {
    const key = `${trade.symbol}_${trade.side}`;
    if (!tradeGroups.has(key)) {
      tradeGroups.set(key, []);
    }
    tradeGroups.get(key)!.push(trade);
  }

  // Process each group
  for (const [key, groupTrades] of tradeGroups) {
    const [symbol, side] = key.split('_');
    
    // Sort trades by quantity and price
    groupTrades.sort((a, b) => {
      if (a.quantity !== b.quantity) {
        return a.quantity - b.quantity;
      }
      return a.price - b.price;
    });

    // Create executions for matching trades
    for (let i = 0; i < groupTrades.length; i += 2) {
      const trade1 = groupTrades[i];
      const trade2 = groupTrades[i + 1];

      if (!trade2) {
        unmatched++;
        continue;
      }

      // Check if trades can be matched
      if (canMatchTrades(trade1, trade2)) {
        try {
          // Create execution record
          const execution = {
            user_id: userId,
            symbol: symbol,
            side: side,
            quantity: Math.min(trade1.quantity, trade2.quantity),
            price: (trade1.price + trade2.price) / 2,
            executed_at: trade1.opened_at,
            trade1_id: trade1.id,
            trade2_id: trade2.id,
            status: 'matched'
          };

          const { error: execError } = await supabase
            .from('executions_normalized')
            .insert(execution);

          if (execError) {
            console.error('Error creating execution:', execError);
            unmatched += 2;
          } else {
            matched += 2;
            executions++;
          }
        } catch (error) {
          console.error('Error processing execution:', error);
          unmatched += 2;
        }
      } else {
        unmatched += 2;
      }
    }
  }

  return { matched, unmatched, executions };
}

/**
 * Check if two trades can be matched
 */
function canMatchTrades(trade1: any, trade2: any): boolean {
  // Basic matching criteria
  if (trade1.symbol !== trade2.symbol) return false;
  if (trade1.side !== trade2.side) return false;
  
  // Price tolerance (within 1% or $0.01)
  const priceDiff = Math.abs(trade1.price - trade2.price);
  const priceTolerance = Math.max(trade1.price * 0.01, 0.01);
  
  if (priceDiff > priceTolerance) return false;
  
  // Time tolerance (within 1 hour)
  const time1 = new Date(trade1.opened_at).getTime();
  const time2 = new Date(trade2.opened_at).getTime();
  const timeDiff = Math.abs(time1 - time2);
  const timeTolerance = 60 * 60 * 1000; // 1 hour in milliseconds
  
  if (timeDiff > timeTolerance) return false;
  
  return true;
}

