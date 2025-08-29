import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20, // High precision for financial calculations
  rounding: Decimal.ROUND_HALF_UP, // Standard financial rounding
  toExpNeg: -7, // Use decimal notation for numbers >= 10^-7
  toExpPos: 21, // Use decimal notation for numbers < 10^21
});

/**
 * Convert any value to a Decimal, handling null/undefined gracefully
 */
export function toDec(n: number | string | null | undefined): Decimal {
  if (n === null || n === undefined) {
    return new Decimal(0);
  }
  
  if (typeof n === 'string') {
    const trimmed = n.trim();
    if (trimmed === '') {
      return new Decimal(0);
    }
    return new Decimal(trimmed);
  }
  
  return new Decimal(n);
}

/**
 * Sum multiple values, converting each to Decimal
 */
export function sumDec(...vals: (Decimal | number | string | null | undefined)[]): Decimal {
  return vals.reduce((sum: Decimal, val) => {
    if (val instanceof Decimal) {
      return sum.plus(val);
    }
    return sum.plus(toDec(val));
  }, new Decimal(0));
}

/**
 * Multiply two values as Decimals
 */
export function mulDec(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  const aDec = a instanceof Decimal ? a : toDec(a);
  const bDec = b instanceof Decimal ? b : toDec(b);
  return aDec.times(bDec);
}

/**
 * Subtract two values as Decimals
 */
export function subDec(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  const aDec = a instanceof Decimal ? a : toDec(a);
  const bDec = b instanceof Decimal ? b : toDec(b);
  return aDec.minus(bDec);
}

/**
 * Divide two values as Decimals
 */
export function divDec(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  const aDec = a instanceof Decimal ? a : toDec(a);
  const bDec = b instanceof Decimal ? b : toDec(b);
  if (bDec.isZero()) {
    throw new Error('Division by zero');
  }
  return aDec.dividedBy(bDec);
}

/**
 * Round a Decimal to currency format (2 decimal places)
 */
export function roundCurrency(dec: Decimal, dp: number = 2): number {
  return dec.toDecimalPlaces(dp, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Calculate size-weighted average price
 */
export function weightedAveragePrice(
  prices: (Decimal | number | string)[],
  quantities: (Decimal | number | string)[]
): Decimal {
  if (prices.length !== quantities.length) {
    throw new Error('Prices and quantities arrays must have the same length');
  }
  
  if (prices.length === 0) {
    return new Decimal(0);
  }
  
  const totalValue = prices.reduce((sum: Decimal, price, i) => {
    return sum.plus(mulDec(price, quantities[i]));
  }, new Decimal(0));
  
  const totalQuantity = sumDec(...quantities);
  
  if (totalQuantity.isZero()) {
    return new Decimal(0);
  }
  
  return divDec(totalValue, totalQuantity);
}

/**
 * Calculate realized P&L for equities: (avg_close - avg_open) * qty - fees
 */
export function calculateEquityPnL(
  avgOpenPrice: Decimal | number | string,
  avgClosePrice: Decimal | number | string,
  quantity: Decimal | number | string,
  fees: Decimal | number | string = 0
): Decimal {
  const priceDiff = subDec(avgClosePrice, avgOpenPrice);
  const grossPnL = mulDec(priceDiff, quantity);
  return subDec(grossPnL, fees);
}

/**
 * Calculate realized P&L for options: leg-wise (close - open) * qty * multiplier - fees
 */
export function calculateOptionPnL(
  legs: Array<{
    openPrice: Decimal | number | string;
    closePrice: Decimal | number | string;
    quantity: Decimal | number | string;
    multiplier: Decimal | number | string;
  }>,
  fees: Decimal | number | string = 0
): Decimal {
  const legPnLs = legs.map(leg => {
    const priceDiff = subDec(leg.closePrice, leg.openPrice);
    const legValue = mulDec(priceDiff, leg.quantity);
    return mulDec(legValue, leg.multiplier);
  });
  
  const grossPnL = sumDec(...legPnLs);
  return subDec(grossPnL, fees);
}

/**
 * Calculate realized P&L for futures: (exit_price - entry_price) / tick * tickValue * contracts - fees
 */
export function calculateFuturesPnL(
  entryPrice: Decimal | number | string,
  exitPrice: Decimal | number | string,
  tickSize: Decimal | number | string,
  tickValue: Decimal | number | string,
  contracts: Decimal | number | string,
  fees: Decimal | number | string = 0
): Decimal {
  const priceDiff = subDec(exitPrice, entryPrice);
  const ticks = divDec(priceDiff, tickSize);
  const grossPnL = mulDec(mulDec(ticks, tickValue), contracts);
  return subDec(grossPnL, fees);
}

/**
 * Format a Decimal as currency string
 */
export function formatCurrency(dec: Decimal, currency: string = 'USD'): string {
  const rounded = roundCurrency(dec);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(rounded);
}

/**
 * Parse a currency string to Decimal
 */
export function parseCurrency(currencyStr: string): Decimal {
  // Remove currency symbols and commas
  const clean = currencyStr.replace(/[$,€£¥]/g, '').trim();
  return toDec(clean);
}

/**
 * Check if a value is effectively zero (within tolerance)
 */
export function isZero(dec: Decimal, tolerance: number = 1e-10): boolean {
  return dec.abs().lessThanOrEqualTo(tolerance);
}

/**
 * Compare two Decimals with tolerance for floating point errors
 */
export function equals(a: Decimal | number | string, b: Decimal | number | string, tolerance: number = 1e-10): boolean {
  return subDec(a, b).abs().lessThanOrEqualTo(tolerance);
}
