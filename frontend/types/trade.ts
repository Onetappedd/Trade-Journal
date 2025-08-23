export type AssetType = "stock" | "option" | "future" | "crypto";

export type BaseTrade = {
  id: string;
  userId: string;
  assetType: AssetType;
  symbol: string;
  side: "long" | "short" | "buy" | "sell";
  quantity: number;
  openPrice: number;
  closePrice?: number | null;
  fees?: number | null;
  openedAt: string;
  closedAt?: string | null;
  status: "open" | "closed" | "partial" | "canceled";
  notes?: string | null;
  realizedPnl?: number | null;
  realizedPnlPct?: number | null;
  tags?: string[] | null;
};

export type OptionTrade = BaseTrade & {
  assetType: "option";
  optionType: "call" | "put";
  strike: number;
  expiration: string;
  multiplier?: number;
};

export type FutureTrade = BaseTrade & {
  assetType: "future";
  contractCode: string;
  expiration: string;
  pointValue: number;
  tickSize?: number | null;
  tickValue?: number | null;
};

export type CryptoTrade = BaseTrade & {
  assetType: "crypto";
  quoteCurrency?: string;
};

export type Trade = BaseTrade | OptionTrade | FutureTrade | CryptoTrade;

// --- Add Zod schemas for Add Trade page imports ---
import { z } from 'zod';

export const stockTradeSchema = z.object({
  assetType: z.literal('stock'),
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.union([z.literal('buy'), z.literal('sell')]),
  quantity: z.number().min(0.0001, 'Enter a positive quantity'),
  price: z.number().min(0.0001, 'Enter a positive price'),
  fees: z.number().optional().default(0),
  datetime: z.string().min(1),
  account: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const optionTradeSchema = z.object({
  assetType: z.literal('option'),
  underlying: z.string().min(1, 'Underlying symbol required'),
  optionType: z.union([z.literal('call'), z.literal('put')]),
  action: z.string().min(1),
  contracts: z.number().int().min(1, 'Enter contracts'),
  multiplier: z.number().optional().default(100),
  strike: z.number().min(0.01),
  expiration: z.string().min(1),
  price: z.number().min(0.0001, 'Enter a positive price'),
  fees: z.number().optional().default(0),
  datetime: z.string().min(1),
  account: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const futureTradeSchema = z.object({
  assetType: z.literal('future'),
  symbol: z.string().min(1, 'Symbol is required'),
  contracts: z.number().int().min(1),
  multiplier: z.number().min(0.01),
  price: z.number().min(0.0001, 'Enter a positive price'),
  expiration: z.string().min(1),
  currency: z.string().optional(),
  fees: z.number().optional().default(0),
  datetime: z.string().min(1),
  account: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const cryptoTradeSchema = z.object({
  assetType: z.literal('crypto'),
  symbol: z.string().min(1, 'Symbol is required'),
  quantity: z.number().min(0.00000001),
  price: z.number().min(0.0001),
  fees: z.number().optional().default(0),
  datetime: z.string().min(1),
  account: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});
