import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { FEATURE_FLAGS } from '@/lib/config/flags';

export async function POST(request: NextRequest) {
  try {
    // Check if CRON is enabled
    if (!FEATURE_FLAGS.CRON_ENABLED) {
      return new NextResponse(null, { status: 204 }); // No-op
    }

    const supabase = getServerSupabase();

    // Get recent equity instruments
    const { data: instruments, error: instrumentsError } = await supabase
      .from('instruments')
      .select('unique_symbol')
      .eq('instrument_type', 'equity')
      .limit(10);

    if (instrumentsError) {
      console.error('Error fetching instruments:', instrumentsError);
      return NextResponse.json({ error: 'Failed to fetch instruments' }, { status: 500 });
    }

    // Insert demo split records for known stocks
    const demoActions = [
      {
        symbol: 'AAPL',
        type: 'split',
        effective_date: '2020-08-31',
        factor: 4, // 4:1 split
        memo_url: 'https://investor.apple.com/news-releases/news-release-details/apple-announces-four-one-stock-split',
        payload: {
          description: '4-for-1 stock split',
          ratio: '4:1',
          reason: 'Make stock more accessible to investors'
        }
      },
      {
        symbol: 'TSLA',
        type: 'split',
        effective_date: '2022-08-25',
        factor: 3, // 3:1 split
        memo_url: 'https://ir.tesla.com/press-release/tesla-announces-three-one-stock-split',
        payload: {
          description: '3-for-1 stock split',
          ratio: '3:1',
          reason: 'Make stock more accessible to employees and investors'
        }
      },
      {
        symbol: 'NVDA',
        type: 'split',
        effective_date: '2021-07-20',
        factor: 4, // 4:1 split
        memo_url: 'https://nvidianews.nvidia.com/news/nvidia-announces-four-for-one-stock-split',
        payload: {
          description: '4-for-1 stock split',
          ratio: '4:1',
          reason: 'Make stock more accessible to investors and employees'
        }
      }
    ];

    // Insert demo actions (with conflict handling to avoid duplicates)
    const { data: insertedActions, error: insertError } = await supabase
      .from('corporate_actions')
      .upsert(demoActions, {
        onConflict: 'symbol,type,effective_date',
        ignoreDuplicates: true
      })
      .select();

    if (insertError) {
      console.error('Error inserting corporate actions:', insertError);
      return NextResponse.json({ error: 'Failed to insert corporate actions' }, { status: 500 });
    }

    console.log(`Synced ${insertedActions?.length || 0} corporate actions`);

    return NextResponse.json({
      success: true,
      synced: insertedActions?.length || 0,
      actions: insertedActions
    });

  } catch (error) {
    console.error('Corporate actions sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
