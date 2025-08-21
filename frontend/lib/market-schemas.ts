import { z } from 'zod';

export const TrendingRowSchema = z.object({
  symbol: z.string().min(1),
  price: z.number().finite(),
  changePct: z.number().finite(),
});

export const TrendingPayloadSchema = z.object({
  ok: z.boolean(),
  usingFallback: z.boolean().optional(),
  data: z.array(TrendingRowSchema).default([]),
});

export type TrendingRow = z.infer<typeof TrendingRowSchema>;

export function parseTrendingPayload(json: unknown): TrendingRow[] {
  const p = TrendingPayloadSchema.safeParse(json);
  if (!p.success || !p.data.ok) return [];
  return p.data.data ?? [];
}

export function toArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
