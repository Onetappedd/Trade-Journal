import { z } from 'zod';

export const sideSchema = z.enum(['buy', 'sell']); // lower-case enforced

export const baseTradeSchema = z
  .object({
    symbol: z.string().trim().min(1, 'Symbol is required'),
    side: sideSchema,
    quantity: z.number().int().positive('Must be > 0'),
    entry_price: z.number().positive('Entry price must be > 0'),
    entry_date: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid entry date' }),
    // Optional exit
    isClosed: z.boolean().optional().default(false),
    exit_price: z.number().positive('Exit price must be > 0').optional().nullable(),
    exit_date: z
      .string()
      .nullable()
      .optional()
      .refine((v) => v == null || !Number.isNaN(Date.parse(v)), { message: 'Invalid exit date' }),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.isClosed) return true;
      return data.exit_price != null && data.exit_date != null;
    },
    { message: 'Exit price and date required when marking trade closed', path: ['exit_price'] },
  )
  .refine(
    (data) => {
      if (!data.isClosed || !data.exit_date) return true;
      const e = Date.parse(data.entry_date);
      const x = Date.parse(data.exit_date);
      return x >= e;
    },
    { message: 'Exit date must be on/after entry date', path: ['exit_date'] },
  );

export const stockTradeSchema = baseTradeSchema.extend({
  asset_type: z.literal('stock'),
});

export const optionTradeSchema = baseTradeSchema
  .extend({
    asset_type: z.literal('option'),
    optionType: z.enum(['call', 'put']),
    strike: z.number().positive('Strike must be > 0'),
    expiration: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid expiration date' }),
    multiplier: z.number().positive().default(100),
  })
  .refine((data) => Date.parse(data.expiration) >= Date.parse(data.entry_date), {
    message: 'Expiration must be on/after entry date',
    path: ['expiration'],
  });

export const futuresTradeSchema = baseTradeSchema.extend({
  asset_type: z.literal('futures'),
  contractCode: z.string().trim().min(1, 'Contract code required'),
  tickSize: z.number().positive(),
  tickValue: z.number().positive(),
  pointMultiplier: z.number().positive(),
});

export const anyTradeSchema = z.discriminatedUnion('asset_type', [
  stockTradeSchema,
  optionTradeSchema,
  futuresTradeSchema,
]);
export type StockTradeInput = z.infer<typeof stockTradeSchema>;
export type OptionTradeInput = z.infer<typeof optionTradeSchema>;
export type FuturesTradeInput = z.infer<typeof futuresTradeSchema>;
export type AnyTradeInput = z.infer<typeof anyTradeSchema>;
