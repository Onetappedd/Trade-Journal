import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  toDec,
  sumDec,
  mulDec,
  subDec,
  divDec,
  roundCurrency,
  weightedAveragePrice,
  calculateEquityPnL,
  calculateOptionPnL,
  calculateFuturesPnL,
  formatCurrency,
  parseCurrency,
  isZero,
  equals,
} from '@/lib/math/money';

describe('Money Math Utilities', () => {
  describe('toDec', () => {
    it('converts numbers to Decimal', () => {
      expect(toDec(123.45)).toEqual(new Decimal(123.45));
      expect(toDec(0)).toEqual(new Decimal(0));
      expect(toDec(-1.23)).toEqual(new Decimal(-1.23));
    });

    it('converts strings to Decimal', () => {
      expect(toDec('123.45')).toEqual(new Decimal(123.45));
      expect(toDec('0')).toEqual(new Decimal(0));
      expect(toDec('-1.23')).toEqual(new Decimal(-1.23));
    });

    it('handles null and undefined', () => {
      expect(toDec(null)).toEqual(new Decimal(0));
      expect(toDec(undefined)).toEqual(new Decimal(0));
    });

    it('handles empty strings', () => {
      expect(toDec('')).toEqual(new Decimal(0));
      expect(toDec('   ')).toEqual(new Decimal(0));
    });
  });

  describe('sumDec', () => {
    it('sums multiple values', () => {
      expect(sumDec(1, 2, 3)).toEqual(new Decimal(6));
      expect(sumDec('1.1', '2.2', '3.3')).toEqual(new Decimal(6.6));
      expect(sumDec(1.1, 2.2, 3.3)).toEqual(new Decimal(6.6));
    });

    it('handles mixed types', () => {
      expect(sumDec(1, '2.5', new Decimal(3.5))).toEqual(new Decimal(7));
    });

    it('handles empty array', () => {
      expect(sumDec()).toEqual(new Decimal(0));
    });

    it('handles null/undefined values', () => {
      expect(sumDec(1, null, 3, undefined)).toEqual(new Decimal(4));
    });
  });

  describe('mulDec', () => {
    it('multiplies two values', () => {
      expect(mulDec(2, 3)).toEqual(new Decimal(6));
      expect(mulDec('2.5', '3.5')).toEqual(new Decimal(8.75));
      expect(mulDec(2.5, 3.5)).toEqual(new Decimal(8.75));
    });

    it('handles zero', () => {
      expect(mulDec(0, 5)).toEqual(new Decimal(0));
      expect(mulDec(5, 0)).toEqual(new Decimal(0));
    });
  });

  describe('subDec', () => {
    it('subtracts two values', () => {
      expect(subDec(5, 3)).toEqual(new Decimal(2));
      expect(subDec('5.5', '3.3')).toEqual(new Decimal(2.2));
      expect(subDec(5.5, 3.3)).toEqual(new Decimal(2.2));
    });

    it('handles negative results', () => {
      expect(subDec(3, 5)).toEqual(new Decimal(-2));
    });
  });

  describe('divDec', () => {
    it('divides two values', () => {
      expect(divDec(6, 2)).toEqual(new Decimal(3));
      expect(divDec('6.6', '2.2')).toEqual(new Decimal(3));
      expect(divDec(6.6, 2.2)).toEqual(new Decimal(3));
    });

    it('throws on division by zero', () => {
      expect(() => divDec(5, 0)).toThrow('Division by zero');
    });
  });

  describe('roundCurrency', () => {
    it('rounds to 2 decimal places by default', () => {
      expect(roundCurrency(new Decimal(123.456))).toBe(123.46);
      expect(roundCurrency(new Decimal(123.454))).toBe(123.45);
    });

    it('rounds to specified decimal places', () => {
      expect(roundCurrency(new Decimal(123.456), 3)).toBe(123.456);
      expect(roundCurrency(new Decimal(123.456), 1)).toBe(123.5);
    });
  });

  describe('weightedAveragePrice', () => {
    it('calculates weighted average correctly', () => {
      const prices = [100, 110, 120];
      const quantities = [10, 20, 30];
      const result = weightedAveragePrice(prices, quantities);
      // (100*10 + 110*20 + 120*30) / (10 + 20 + 30) = (1000 + 2200 + 3600) / 60 = 6800 / 60 = 113.33
      expect(result.toNumber()).toBeCloseTo(113.33, 2);
    });

    it('handles single price/quantity', () => {
      const prices = [100];
      const quantities = [10];
      const result = weightedAveragePrice(prices, quantities);
      expect(result).toEqual(new Decimal(100));
    });

    it('returns 0 for empty arrays', () => {
      const result = weightedAveragePrice([], []);
      expect(result).toEqual(new Decimal(0));
    });

    it('throws on mismatched arrays', () => {
      expect(() => weightedAveragePrice([1, 2], [1])).toThrow('Prices and quantities arrays must have the same length');
    });

    it('returns 0 when total quantity is 0', () => {
      const result = weightedAveragePrice([100, 200], [0, 0]);
      expect(result).toEqual(new Decimal(0));
    });
  });

  describe('calculateEquityPnL', () => {
    it('calculates positive P&L', () => {
      const result = calculateEquityPnL(100, 110, 100, 5);
      expect(result.toNumber()).toBe(995); // (110-100)*100 - 5 = 1000 - 5 = 995
    });

    it('calculates negative P&L', () => {
      const result = calculateEquityPnL(110, 100, 100, 5);
      expect(result.toNumber()).toBe(-1005); // (100-110)*100 - 5 = -1000 - 5 = -1005
    });

    it('handles zero fees', () => {
      const result = calculateEquityPnL(100, 110, 100);
      expect(result.toNumber()).toBe(1000); // (110-100)*100 = 1000
    });
  });

  describe('calculateOptionPnL', () => {
    it('calculates single leg P&L', () => {
      const legs = [{
        openPrice: 5,
        closePrice: 7,
        quantity: 100,
        multiplier: 100
      }];
      const result = calculateOptionPnL(legs, 10);
      expect(result.toNumber()).toBe(19990); // (7-5)*100*100 - 10 = 20000 - 10 = 19990
    });

    it('calculates multi-leg P&L', () => {
      const legs = [
        {
          openPrice: 5,
          closePrice: 7,
          quantity: 100,
          multiplier: 100
        },
        {
          openPrice: 3,
          closePrice: 1,
          quantity: 100,
          multiplier: 100
        }
      ];
      const result = calculateOptionPnL(legs, 20);
      // (7-5)*100*100 + (1-3)*100*100 - 20 = 20000 - 20000 - 20 = -20
      expect(result.toNumber()).toBe(-20);
    });
  });

  describe('calculateFuturesPnL', () => {
    it('calculates positive P&L', () => {
      const result = calculateFuturesPnL(100, 102, 0.25, 12.5, 10, 50);
      // (102-100)/0.25 * 12.5 * 10 - 50 = 2/0.25 * 12.5 * 10 - 50 = 8 * 12.5 * 10 - 50 = 1000 - 50 = 950
      expect(result.toNumber()).toBe(950);
    });

    it('calculates negative P&L', () => {
      const result = calculateFuturesPnL(102, 100, 0.25, 12.5, 10, 50);
      // (100-102)/0.25 * 12.5 * 10 - 50 = -2/0.25 * 12.5 * 10 - 50 = -8 * 12.5 * 10 - 50 = -1000 - 50 = -1050
      expect(result.toNumber()).toBe(-1050);
    });
  });

  describe('formatCurrency', () => {
    it('formats USD correctly', () => {
      expect(formatCurrency(new Decimal(1234.56))).toBe('$1,234.56');
      expect(formatCurrency(new Decimal(0))).toBe('$0.00');
      expect(formatCurrency(new Decimal(-1234.56))).toBe('-$1,234.56');
    });

    it('formats with custom currency', () => {
      expect(formatCurrency(new Decimal(1234.56), 'EUR')).toBe('€1,234.56');
    });
  });

  describe('parseCurrency', () => {
    it('parses currency strings', () => {
      expect(parseCurrency('$1,234.56')).toEqual(new Decimal(1234.56));
      expect(parseCurrency('€1,234.56')).toEqual(new Decimal(1234.56));
      expect(parseCurrency('£1,234.56')).toEqual(new Decimal(1234.56));
    });

    it('handles plain numbers', () => {
      expect(parseCurrency('1234.56')).toEqual(new Decimal(1234.56));
    });
  });

  describe('isZero', () => {
    it('identifies zero values', () => {
      expect(isZero(new Decimal(0))).toBe(true);
      expect(isZero(new Decimal(0.0000000001))).toBe(true); // Within tolerance
      expect(isZero(new Decimal(0.1))).toBe(false);
    });
  });

  describe('equals', () => {
    it('compares values with tolerance', () => {
      expect(equals(0.1 + 0.2, 0.3)).toBe(true); // Classic floating point issue
      expect(equals(1.0, 1.0000000001)).toBe(true); // Within tolerance
      expect(equals(1.0, 1.1)).toBe(false);
    });
  });

  describe('Floating Point Edge Cases', () => {
    it('handles 0.1 + 0.2 = 0.3 correctly', () => {
      const result = sumDec(0.1, 0.2);
      expect(result.toNumber()).toBe(0.3);
      expect(equals(result, 0.3)).toBe(true);
    });

    it('handles many small additions without drift', () => {
      const values = Array(1000).fill(0.1);
      const result = sumDec(...values);
      expect(result.toNumber()).toBe(100);
      expect(equals(result, 100)).toBe(true);
    });

    it('handles large fee sums precisely', () => {
      const fees = Array(1000).fill(0.01);
      const result = sumDec(...fees);
      expect(result.toNumber()).toBe(10);
      expect(equals(result, 10)).toBe(true);
    });

    it('handles many partial fills correctly', () => {
      const prices = [100, 101, 102, 103, 104];
      const quantities = [10, 20, 30, 25, 15];
      const result = weightedAveragePrice(prices, quantities);
      // (100*10 + 101*20 + 102*30 + 103*25 + 104*15) / (10 + 20 + 30 + 25 + 15) = 10215 / 100 = 102.15
      expect(result.toNumber()).toBeCloseTo(102.15, 2);
    });

    it('handles futures tick math precisely', () => {
      // ES futures: tick size 0.25, tick value $12.50
      const entryPrice = 4500.25;
      const exitPrice = 4501.00;
      const tickSize = 0.25;
      const tickValue = 12.50;
      const contracts = 5;
      const fees = 25.00;

      const result = calculateFuturesPnL(entryPrice, exitPrice, tickSize, tickValue, contracts, fees);
      // Let's debug the calculation step by step
      const priceDiff = exitPrice - entryPrice; // 0.75
      const ticks = priceDiff / tickSize; // 0.75 / 0.25 = 3
      const grossPnL = ticks * tickValue * contracts; // 3 * 12.50 * 5 = 187.50
      const netPnL = grossPnL - fees; // 187.50 - 25.00 = 162.50
      expect(result.toNumber()).toBe(162.50);
    });

    it('handles very small price differences', () => {
      const result = calculateEquityPnL(100.0001, 100.0002, 1000000);
      expect(result.toNumber()).toBe(100); // Should be exactly 100, not 99.99999999999999
    });

    it('handles very large quantities', () => {
      const result = calculateEquityPnL(100, 101, 1000000000);
      expect(result.toNumber()).toBe(1000000000); // Should be exactly 1 billion
    });
  });
});
