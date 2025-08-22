import { z } from 'zod';

// Common fields for all trade types
const baseTradeSchema = z.object({
  side: z.enum(['buy', 'sell']),
  datetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid datetime format',
  }),
  fees: z.number().min(0).default(0),
  account: z.string().optional(),
  notes: z.string().optional(),
});

// Stock trade schema
export const stockTradeSchema = baseTradeSchema.extend({
  assetType: z.literal('stock'),
  symbol: z.string().min(1, 'Symbol is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  price: z.number().positive('Price must be greater than 0'),
});

// Option trade schema
export const optionTradeSchema = baseTradeSchema.extend({
  assetType: z.literal('option'),
  underlying: z.string().min(1, 'Underlying symbol is required'),
  optionType: z.enum(['call', 'put']),
  action: z.enum(['buy_to_open', 'sell_to_open', 'buy_to_close', 'sell_to_close']),
  contracts: z.number().int().positive('Contracts must be a positive integer'),
  strike: z.number().positive('Strike price must be greater than 0'),
  expiration: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid expiration date',
  }),
  price: z.number().min(0, 'Price cannot be negative'),
  multiplier: z.number().positive().default(100),
});

// Future trade schema
export const futureTradeSchema = baseTradeSchema.extend({
  assetType: z.literal('future'),
  symbol: z.string().min(1, 'Symbol is required'),
  contracts: z.number().int().positive('Contracts must be a positive integer'),
  expiration: z.string().regex(/^\d{4}-\d{2}$/, 'Expiration must be YYYY-MM format'),
  price: z.number(),
  multiplier: z.number().positive('Multiplier must be greater than 0'),
  currency: z.string().default('USD'),
});

// Crypto trade schema
export const cryptoTradeSchema = baseTradeSchema.extend({
  assetType: z.literal('crypto'),
  symbol: z.string().min(1, 'Symbol is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  price: z.number().positive('Price must be greater than 0'),
});

// Discriminated union of all trade types
export const TradeSchema = z.discriminatedUnion('assetType', [
  stockTradeSchema,
  optionTradeSchema,
  futureTradeSchema,
  cryptoTradeSchema,
]);

// TypeScript types
export type StockTrade = z.infer<typeof stockTradeSchema>;
export type OptionTrade = z.infer<typeof optionTradeSchema>;
export type FutureTrade = z.infer<typeof futureTradeSchema>;
export type CryptoTrade = z.infer<typeof cryptoTradeSchema>;
export type Trade = z.infer<typeof TradeSchema>;

// Helper type for asset types
export type AssetType = Trade['assetType'];