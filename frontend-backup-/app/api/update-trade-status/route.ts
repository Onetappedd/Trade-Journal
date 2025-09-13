import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This API endpoint updates trade statuses based on position matching
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    // Fetch all trades for the user, ordered by date
    const { data: trades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: true });

    if (fetchError) throw fetchError;
    if (!trades || trades.length === 0) {
      return NextResponse.json({ message: 'No trades to update' });
    }

    // Group trades by symbol and option details to track positions
    const positions = new Map<
      string,
      {
        openQuantity: number;
        trades: any[];
      }
    >();

    const updates: { id: string; status: string }[] = [];

    for (const trade of trades) {
      // Create a unique key for the position
      const positionKey =
        trade.asset_type === 'option'
          ? `${trade.underlying || trade.symbol}_${trade.option_type}_${trade.strike_price}_${trade.expiration_date}`
          : trade.symbol;

      let position = positions.get(positionKey);

      if (!position) {
        position = {
          openQuantity: 0,
          trades: [],
        };
        positions.set(positionKey, position);
      }

      position.trades.push(trade);

      if (trade.side === 'buy') {
        // Opening or adding to position
        position.openQuantity += trade.quantity;

        // Mark as open if we have open quantity
        if (position.openQuantity > 0) {
          updates.push({ id: trade.id, status: 'open' });
        }
      } else if (trade.side === 'sell') {
        // Closing or reducing position
        const previousOpenQty = position.openQuantity;
        position.openQuantity -= trade.quantity;

        // Mark the sell trade as closed
        updates.push({ id: trade.id, status: 'closed' });

        // If this sell closes the entire position, mark all related buys as closed
        if (position.openQuantity <= 0) {
          // Mark all previous buy trades for this position as closed
          for (const prevTrade of position.trades) {
            if (prevTrade.side === 'buy' && prevTrade.id !== trade.id) {
              updates.push({ id: prevTrade.id, status: 'closed' });
            }
          }
        } else {
          // Partial close - calculate which buy trades are closed
          let remainingToClose = trade.quantity;

          // Go through buy trades in FIFO order and mark as closed
          for (const prevTrade of position.trades) {
            if (prevTrade.side === 'buy' && remainingToClose > 0) {
              if (prevTrade.quantity <= remainingToClose) {
                // This buy trade is fully closed
                updates.push({ id: prevTrade.id, status: 'closed' });
                remainingToClose -= prevTrade.quantity;
              } else {
                // This buy trade is partially closed - keep it open
                updates.push({ id: prevTrade.id, status: 'open' });
              }
            }
          }
        }
      }
    }

    // Apply all status updates
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('trades')
        .update({ status: update.status })
        .eq('id', update.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error(`Failed to update trade ${update.id}:`, updateError);
        errorCount++;
      } else {
        successCount++;
      }
    }

    return NextResponse.json({
      message: 'Trade statuses updated',
      updated: successCount,
      errors: errorCount,
      totalTrades: trades.length,
    });
  } catch (error: any) {
    console.error('Error updating trade statuses:', error);
    return NextResponse.json(
      {
        error: 'Failed to update trade statuses',
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// GET endpoint to trigger status update
export async function GET(req: NextRequest) {
  return POST(req);
}
