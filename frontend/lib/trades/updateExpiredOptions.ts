import { SupabaseClient } from '@supabase/supabase-js';

export interface ExpiredOptionUpdate {
  tradesUpdated: number;
  errors: number;
  expiredTrades: any[];
}

/**
 * Updates open option trades that have passed their expiration date
 * Marks them as 'expired' (worthless) with exit_price = 0.00 and exit_date = expiration_date
 * and sets them as editable for user review/correction.
 */
export async function updateExpiredOptionsTrades(
  userId: string, 
  supabase: SupabaseClient
): Promise<ExpiredOptionUpdate> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  try {
    // Fetch all open option trades for the user
    const { data: openOptions, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('asset_type', 'option')
      .eq('status', 'open');

    if (fetchError) {
      console.error('Error fetching open options:', fetchError);
      throw new Error(fetchError.message);
    }

    if (!openOptions || openOptions.length === 0) {
      return {
        tradesUpdated: 0,
        errors: 0,
        expiredTrades: [],
      };
    }

    // Filter for expired options (expiration_date < today)
    const expiredOptions = openOptions.filter((trade) => {
      if (!trade.expiration_date) return false;

      // Compare dates (both in YYYY-MM-DD format)
      return trade.expiration_date < today;
    });

    if (expiredOptions.length === 0) {
      return {
        tradesUpdated: 0,
        errors: 0,
        expiredTrades: [],
      };
    }

    // Update each expired option
    let successCount = 0;
    let errorCount = 0;
    const updatedTrades: any[] = [];

    for (const trade of expiredOptions) {
      const { error: updateError } = await supabase
        .from('trades')
        .update({
          status: 'expired',
          editable: true,
          exit_price: 0,
          exit_date: trade.expiration_date || today,
          // Add a note about automatic expiration
          notes: trade.notes
            ? `${trade.notes}\n[Auto-marked as expired worthless on ${today} (exit_price set to 0.00)]`
            : `[Auto-marked as expired worthless on ${today} (exit_price set to 0.00)]`,
        })
        .eq('id', trade.id)
        .eq('user_id', userId); // Extra safety check

      if (updateError) {
        console.error(`Failed to update trade ${trade.id}:`, updateError);
        errorCount++;
      } else {
        successCount++;
        updatedTrades.push({
          ...trade,
          status: 'expired',
          editable: true,
        });
      }
    }

    return {
      tradesUpdated: successCount,
      errors: errorCount,
      expiredTrades: updatedTrades,
    };
  } catch (error) {
    console.error('Error in updateExpiredOptionsTrades:', error);
    throw error;
  }
}

/**
 * Check if user has any expired options that need attention
 */
export async function checkForExpiredOptions(
  userId: string, 
  supabase: SupabaseClient
): Promise<number> {
  try {
    // Try HEAD request first, fallback to minimal GET if it fails
    let count = 0;
    let error = null;
    
    try {
      const { count: headCount, error: headError } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('asset_type', 'option')
        .eq('status', 'expired')
        .is('editable', true);
      
      count = headCount || 0;
      error = headError;
    } catch (headError) {
      // Fallback to minimal GET request
      try {
        const { data, error: getError } = await supabase
          .from('trades')
          .select('id')
          .eq('user_id', userId)
          .eq('asset_type', 'option')
          .eq('status', 'expired')
          .is('editable', true)
          .range(0, 0);
        
        count = data ? 1 : 0; // If we get any data, there's at least one
        error = getError;
        
        // Log fallback usage once
        console.warn('checkForExpiredOptions: HEAD request failed, used GET fallback');
      } catch (fallbackError) {
        error = fallbackError;
        count = 0;
      }
    }

    if (error) {
      console.error('Error checking expired options:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in checkForExpiredOptions:', error);
    return 0;
  }
}
