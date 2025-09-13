export interface AdjustPriceQtyParams {
  price: number;
  qty: number;
  factor: number;
  direction: 'forward' | 'backward';
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
 * Get split factors for demo purposes (client-side)
 * In a real implementation, this would come from an API call
 */
export function getDemoSplitFactors(): Record<string, number> {
  return {
    'AAPL': 4, // 4:1 split on 2020-08-31
    'TSLA': 3, // 3:1 split on 2022-08-25
    'NVDA': 4, // 4:1 split on 2021-07-20
  };
}
