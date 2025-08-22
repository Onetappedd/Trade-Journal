export type AssetType = "stock" | "option" | "future" | "crypto";
export type Side = "long" | "short" | "buy" | "sell";
export interface Trade {
  id?: string;
  symbol?: string;
  underlying?: string;
  assetType: AssetType;
  side?: Side;
  quantity?: number;
  price?: number;
  contracts?: number;
  multiplier?: number;
  action?: string;
  optionType?: string;
  strike?: number;
  expiration?: string;
  avgEntry?: number;
  avgExit?: number;
  fees?: number;
  pnl?: number;
  grossPnl?: number;
  date?: string;
  closeDate?: string;
  durationMin?: number;
  strategy?: string;
  tags?: string[];
  notes?: string;
  fills?: Array<{ time: string; price: number; qty: number; side: "B"|"S" }>;
  attachments?: Array<{ id: string; name: string; url: string }>;
  rMultiple?: number;
  account?: string;
  currency?: string;
  datetime?: string;
  stop?: number;
}

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

export const TradeSchema = z.union([
  stockTradeSchema,
  optionTradeSchema,
  futureTradeSchema,
  cryptoTradeSchema,
]);
