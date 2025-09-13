import { getServerSupabase } from '@/lib/supabase/server';

export interface SplitFactorParams {
  symbol: string;
  asOfDate?: string; // ISO date string, defaults to current date
}

export interface AdjustPriceQtyParams {
  price: number;
  qty: number;
  factor: number;
  direction: 'forward' | 'backward';
}

/**
 * Get the cumulative split factor for a symbol as of a given date
 * Returns the product of all split factors effective before the given date
 */
export async function getSplitFactor({ symbol, asOfDate }: SplitFactorParams): Promise<number> {
  const supabase = getServerSupabase();
  
  // Default to current date if not provided
  const effectiveDate = asOfDate || new Date().toISOString().split('T')[0];
  
  try {
    // Get all split actions for this symbol effective before or on the given date
    const { data: actions, error } = await supabase
      .from('corporate_actions')
      .select('factor')
      .eq('symbol', symbol)
      .eq('type', 'split')
      .lte('effective_date', effectiveDate)
      .order('effective_date', { ascending: true });

    if (error) {
      console.error('Error fetching split factors:', error);
      return 1; // Default to no adjustment on error
    }

    // Calculate cumulative factor (product of all factors)
    const cumulativeFactor = actions?.reduce((product, action) => {
      return product * (action.factor || 1);
    }, 1) || 1;

    return cumulativeFactor;
  } catch (error) {
    console.error('Error calculating split factor:', error);
    return 1; // Default to no adjustment on error
  }
}

/**
 * Adjust price and quantity based on a split factor
 * 
 * @param price - Original price
 * @param qty - Original quantity
 * @param factor - Split factor (e.g., 4 for 4:1 split)
 * @param direction - 'forward' (adjust for split) or 'backward' (reverse split adjustment)
 * 
 * @returns Object with adjusted price and quantity
 */
export function adjustPriceQty({ price, qty, factor, direction }: AdjustPriceQtyParams): {
  adjustedPrice: number;
  adjustedQty: number;
} {
  if (factor <= 0) {
    throw new Error('Split factor must be positive');
  }

  let adjustedPrice: number;
  let adjustedQty: number;

  if (direction === 'forward') {
    // Adjust for split: price decreases, quantity increases
    adjustedPrice = price / factor;
    adjustedQty = qty * factor;
  } else {
    // Reverse split adjustment: price increases, quantity decreases
    adjustedPrice = price * factor;
    adjustedQty = qty / factor;
  }

  return {
    adjustedPrice: Math.round(adjustedPrice * 1000000) / 1000000, // Round to 6 decimal places
    adjustedQty: Math.round(adjustedQty * 1000000) / 1000000
  };
}

/**
 * Get all corporate actions for a symbol within a date range
 */
export async function getCorporateActions(
  symbol: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  const supabase = getServerSupabase();
  
  let query = supabase
    .from('corporate_actions')
    .select('*')
    .eq('symbol', symbol)
    .order('effective_date', { ascending: true });

  if (startDate) {
    query = query.gte('effective_date', startDate);
  }

  if (endDate) {
    query = query.lte('effective_date', endDate);
  }

  const { data: actions, error } = await query;

  if (error) {
    console.error('Error fetching corporate actions:', error);
    return [];
  }

  return actions || [];
}

/**
 * Check if a symbol has any corporate actions
 */
export async function hasCorporateActions(symbol: string): Promise<boolean> {
  const supabase = getServerSupabase();
  
  const { data, error } = await supabase
    .from('corporate_actions')
    .select('id')
    .eq('symbol', symbol)
    .limit(1);

  if (error) {
    console.error('Error checking corporate actions:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}
