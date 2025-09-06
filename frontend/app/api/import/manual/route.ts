import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

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
    const requiredFields = ['symbol', 'side', 'quantity', 'price', 'timestamp'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Normalize the data
    const normalizedData = {
      symbol: body.symbol.toUpperCase().trim(),
      side: body.side.toLowerCase(),
      quantity: parseFloat(body.quantity),
      price: parseFloat(body.price),
      fees: parseFloat(body.fees || 0),
      currency: (body.currency || 'USD').toUpperCase(),
      venue: body.venue || 'UNKNOWN',
      asset_type: body.instrument_type || 'equity',
      entry_date: new Date(body.timestamp).toISOString(),
      exit_price: body.exit_price ? parseFloat(body.exit_price) : null,
      exit_date: body.exit_date ? new Date(body.exit_date).toISOString() : null,
      status: body.exit_price ? 'closed' : 'open',
      notes: body.notes || null,
      // Option-specific fields
      underlying: body.underlying ? body.underlying.toUpperCase().trim() : null,
      option_type: body.option_type || null,
      strike: body.strike ? parseFloat(body.strike) : null,
      expiration: body.expiry ? new Date(body.expiry).toISOString().split('T')[0] : null,
      multiplier: body.multiplier ? parseFloat(body.multiplier) : 100,
    };

    // Create trade directly in the trades table
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        symbol: normalizedData.symbol,
        side: normalizedData.side,
        quantity: normalizedData.quantity,
        price: normalizedData.price,
        fees: normalizedData.fees,
        asset_type: normalizedData.asset_type,
        trade_date: normalizedData.entry_date,
        notes: normalizedData.notes,
        // Option-specific fields (if they exist in the table)
        underlying: normalizedData.underlying,
        option_type: normalizedData.option_type,
        strike: normalizedData.strike,
        expiration: normalizedData.expiration,
        multiplier: normalizedData.multiplier,
        // Calculate P&L if exit price is provided
        profit_loss: normalizedData.exit_price ? 
          (normalizedData.side === 'buy' ? 
            (normalizedData.exit_price - normalizedData.price) * normalizedData.quantity - normalizedData.fees :
            (normalizedData.price - normalizedData.exit_price) * normalizedData.quantity - normalizedData.fees
          ) : null,
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Error creating trade:', tradeError);
      console.error('Trade data attempted:', {
        user_id: user.id,
        symbol: normalizedData.symbol,
        side: normalizedData.side,
        quantity: normalizedData.quantity,
        price: normalizedData.price,
        fees: normalizedData.fees,
        asset_type: normalizedData.asset_type,
        trade_date: normalizedData.entry_date,
        notes: normalizedData.notes,
      });
      return NextResponse.json({ 
        error: 'Failed to create trade', 
        details: tradeError.message,
        attemptedData: {
          symbol: normalizedData.symbol,
          side: normalizedData.side,
          quantity: normalizedData.quantity,
          price: normalizedData.price,
          asset_type: normalizedData.asset_type,
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      tradeId: trade.id,
      message: 'Trade added successfully'
    });

  } catch (error) {
    console.error('Manual entry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
