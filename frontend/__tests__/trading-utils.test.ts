// Basic unit tests for P&L utilities
import {
  calcStockPnl,
  calcOptionPnl,
  calcFuturesPnl,
  enforceTick,
  roundToTick,
} from '@/lib/trading';

function approx(a: number, b: number, eps = 1e-8) {
  return Math.abs(a - b) < eps;
}

describe('P&L utilities', () => {
  test('stock long/short', () => {
    expect(calcStockPnl({ side: 'buy', qty: 10, entry: 100, exit: 110 })).toBe(100);
    expect(calcStockPnl({ side: 'sell', qty: 10, entry: 100, exit: 90 })).toBe(100);
  });
  test('options with multiplier', () => {
    expect(
      calcOptionPnl({ side: 'buy', contracts: 2, entry: 1.5, exit: 2.0, multiplier: 100 }),
    ).toBe(100);
    expect(
      calcOptionPnl({ side: 'sell', contracts: 1, entry: 3.0, exit: 1.0, multiplier: 100 }),
    ).toBe(200);
  });
  test('futures point multiplier', () => {
    expect(
      calcFuturesPnl({ side: 'buy', contracts: 1, entry: 4000, exit: 4001, pointMultiplier: 50 }),
    ).toBe(50);
    expect(
      calcFuturesPnl({ side: 'sell', contracts: 2, entry: 12000, exit: 1199, pointMultiplier: 5 }),
    ).toBeCloseTo((12000 - 1199) * 5 * 2 * -1); // negative move for short reversed sign
  });
  test('tick enforcement', () => {
    expect(enforceTick(4000.25, 0.25)).toBe(true);
    expect(enforceTick(4000.26, 0.25)).toBe(false);
    expect(approx(roundToTick(4000.26, 0.25), 4000.25)).toBe(true);
  });
  test('zero/undefined exits yield 0', () => {
    expect(calcStockPnl({ side: 'buy', qty: 1, entry: 10, exit: undefined })).toBe(0);
    expect(
      calcOptionPnl({ side: 'buy', contracts: 1, entry: 1, exit: undefined, multiplier: 100 }),
    ).toBe(0);
    expect(
      calcFuturesPnl({
        side: 'buy',
        contracts: 1,
        entry: 4000,
        exit: undefined,
        pointMultiplier: 50,
      }),
    ).toBe(0);
  });
});
