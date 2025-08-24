import { describe, it, expect } from 'vitest';
import { calcPnL, statusOf, isClosed, getFuturesPointValue, usd } from '@/lib/domain/trades';
import type { Trade } from '@/lib/domain/trades';

describe('Trade Domain Logic', () => {
  describe('calcPnL', () => {
    it('should calculate stock PnL correctly for long position', () => {
      const trade: Trade = {
        id: '1',
        symbol: 'AAPL',
        asset_type: 'stock',
        side: 'Buy',
        quantity: 100,
        open_price: 150,
        close_price: 155,
        fees: 5,
      };

      const pnl = calcPnL(trade);
      expect(pnl.realized).toBe(495); // (155 - 150) * 100 - 5
      expect(pnl.unrealized).toBe(0);
      expect(pnl.total).toBe(495);
    });

    it('should calculate stock PnL correctly for short position', () => {
      const trade: Trade = {
        id: '2',
        symbol: 'TSLA',
        asset_type: 'stock',
        side: 'Sell',
        quantity: 50,
        open_price: 200,
        close_price: 190,
        fees: 3,
      };

      const pnl = calcPnL(trade);
      expect(pnl.realized).toBe(497); // (200 - 190) * 50 - 3
      expect(pnl.unrealized).toBe(0);
      expect(pnl.total).toBe(497);
    });

    it('should calculate options PnL with default multiplier', () => {
      const trade: Trade = {
        id: '3',
        symbol: 'AAPL240315C150',
        asset_type: 'option',
        side: 'Buy',
        quantity: 1,
        open_price: 2.50,
        close_price: 3.00,
        fees: 1.50,
      };

      const pnl = calcPnL(trade);
      expect(pnl.realized).toBe(48.50); // (3.00 - 2.50) * 1 * 100 - 1.50
      expect(pnl.unrealized).toBe(0);
      expect(pnl.total).toBe(48.50);
    });

    it('should calculate options PnL with custom multiplier', () => {
      const trade: Trade = {
        id: '4',
        symbol: 'SPY240315C500',
        asset_type: 'option',
        side: 'Sell',
        quantity: 2,
        open_price: 1.00,
        close_price: 0.50,
        fees: 2.00,
        multiplier: 50,
      };

      const pnl = calcPnL(trade);
      expect(pnl.realized).toBe(48); // (1.00 - 0.50) * 2 * 50 - 2.00
      expect(pnl.unrealized).toBe(0);
      expect(pnl.total).toBe(48);
    });

    it('should calculate futures PnL with symbol inference', () => {
      const trade: Trade = {
        id: '5',
        symbol: 'ES2403',
        asset_type: 'futures',
        side: 'Buy',
        quantity: 1,
        open_price: 4500,
        close_price: 4510,
        fees: 5.00,
      };

      const pnl = calcPnL(trade);
      expect(pnl.realized).toBe(495); // (4510 - 4500) * 1 * 50 - 5.00
      expect(pnl.unrealized).toBe(0);
      expect(pnl.total).toBe(495);
    });

    it('should calculate futures PnL with override point value', () => {
      const trade: Trade = {
        id: '6',
        symbol: 'CL2403',
        asset_type: 'futures',
        side: 'Sell',
        quantity: 2,
        open_price: 75.00,
        close_price: 74.00,
        fees: 10.00,
        point_value: 1000,
      };

      const pnl = calcPnL(trade);
      expect(pnl.realized).toBe(1990); // (75.00 - 74.00) * 2 * 1000 - 10.00
      expect(pnl.unrealized).toBe(0);
      expect(pnl.total).toBe(1990);
    });

    it('should calculate crypto PnL', () => {
      const trade: Trade = {
        id: '7',
        symbol: 'BTC',
        asset_type: 'crypto',
        side: 'Buy',
        quantity: 0.5,
        open_price: 50000,
        close_price: 52000,
        fees: 25,
      };

      const pnl = calcPnL(trade);
      expect(pnl.realized).toBe(975); // (52000 - 50000) * 0.5 - 25
      expect(pnl.unrealized).toBe(0);
      expect(pnl.total).toBe(975);
    });

    it('should calculate unrealized PnL when close_price is null but last_price exists', () => {
      const trade: Trade = {
        id: '8',
        symbol: 'AAPL',
        asset_type: 'stock',
        side: 'Buy',
        quantity: 100,
        open_price: 150,
        close_price: null,
        last_price: 152,
        fees: 5,
      };

      const pnl = calcPnL(trade);
      expect(pnl.realized).toBe(0);
      expect(pnl.unrealized).toBe(195); // (152 - 150) * 100 - 5
      expect(pnl.total).toBe(195);
    });

    it('should handle null/undefined values safely', () => {
      const trade: Trade = {
        id: '9',
        symbol: 'AAPL',
        asset_type: 'stock',
        side: 'Buy',
        quantity: 0,
        open_price: 0,
        close_price: null,
        fees: null,
      };

      const pnl = calcPnL(trade);
      expect(pnl.realized).toBe(0);
      expect(pnl.unrealized).toBe(0);
      expect(pnl.total).toBe(0);
    });
  });

  describe('statusOf', () => {
    it('should return Closed when close_price is set', () => {
      const trade: Trade = {
        id: '1',
        symbol: 'AAPL',
        asset_type: 'stock',
        side: 'Buy',
        quantity: 100,
        open_price: 150,
        close_price: 155,
      };

      expect(statusOf(trade)).toBe('Closed');
    });

    it('should return Closed when closed_at is set', () => {
      const trade: Trade = {
        id: '2',
        symbol: 'TSLA',
        asset_type: 'stock',
        side: 'Sell',
        quantity: 50,
        open_price: 200,
        closed_at: '2024-01-15T10:00:00Z',
      };

      expect(statusOf(trade)).toBe('Closed');
    });

    it('should return Closed when remaining_qty is 0', () => {
      const trade: Trade = {
        id: '3',
        symbol: 'MSFT',
        asset_type: 'stock',
        side: 'Buy',
        quantity: 100,
        open_price: 300,
        remaining_qty: 0,
      };

      expect(statusOf(trade)).toBe('Closed');
    });

    it('should return Partial when remaining_qty is less than quantity', () => {
      const trade: Trade = {
        id: '4',
        symbol: 'GOOGL',
        asset_type: 'stock',
        side: 'Buy',
        quantity: 100,
        open_price: 150,
        remaining_qty: 25,
      };

      expect(statusOf(trade)).toBe('Partial');
    });

    it('should return Open when no closing indicators are present', () => {
      const trade: Trade = {
        id: '5',
        symbol: 'META',
        asset_type: 'stock',
        side: 'Buy',
        quantity: 100,
        open_price: 350,
      };

      expect(statusOf(trade)).toBe('Open');
    });
  });

  describe('isClosed', () => {
    it('should return true when close_price is set', () => {
      const trade: Trade = {
        id: '1',
        symbol: 'AAPL',
        asset_type: 'stock',
        side: 'Buy',
        quantity: 100,
        open_price: 150,
        close_price: 155,
      };

      expect(isClosed(trade)).toBe(true);
    });

    it('should return true when closed_at is set', () => {
      const trade: Trade = {
        id: '2',
        symbol: 'TSLA',
        asset_type: 'stock',
        side: 'Sell',
        quantity: 50,
        open_price: 200,
        closed_at: '2024-01-15T10:00:00Z',
      };

      expect(isClosed(trade)).toBe(true);
    });

    it('should return true when remaining_qty is 0', () => {
      const trade: Trade = {
        id: '3',
        symbol: 'MSFT',
        asset_type: 'stock',
        side: 'Buy',
        quantity: 100,
        open_price: 300,
        remaining_qty: 0,
      };

      expect(isClosed(trade)).toBe(true);
    });

    it('should return false when trade is open', () => {
      const trade: Trade = {
        id: '4',
        symbol: 'GOOGL',
        asset_type: 'stock',
        side: 'Buy',
        quantity: 100,
        open_price: 150,
      };

      expect(isClosed(trade)).toBe(false);
    });
  });

  describe('getFuturesPointValue', () => {
    it('should return correct point value for ES', () => {
      expect(getFuturesPointValue('ES2403')).toBe(50);
    });

    it('should return correct point value for MES', () => {
      expect(getFuturesPointValue('MES2403')).toBe(5);
    });

    it('should return correct point value for NQ', () => {
      expect(getFuturesPointValue('NQ2403')).toBe(20);
    });

    it('should return correct point value for CL', () => {
      expect(getFuturesPointValue('CL2403')).toBe(1000);
    });

    it('should return override when provided', () => {
      expect(getFuturesPointValue('ES2403', 100)).toBe(100);
    });

    it('should return multiplier when provided', () => {
      expect(getFuturesPointValue('ES2403', null, 25)).toBe(25);
    });

    it('should return 1 for unknown symbols', () => {
      expect(getFuturesPointValue('UNKNOWN')).toBe(1);
    });
  });

  describe('usd', () => {
    it('should format positive numbers correctly', () => {
      expect(usd(1234.56)).toBe('$1,234.56');
    });

    it('should format negative numbers correctly', () => {
      expect(usd(-1234.56)).toBe('-$1,234.56');
    });

    it('should handle zero', () => {
      expect(usd(0)).toBe('$0.00');
    });

    it('should handle null', () => {
      expect(usd(null as any)).toBe('—');
    });

    it('should handle undefined', () => {
      expect(usd(undefined as any)).toBe('—');
    });

    it('should handle NaN', () => {
      expect(usd(NaN)).toBe('—');
    });
  });
});
