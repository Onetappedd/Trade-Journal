import { createClient } from "@/lib/supabase-server";
import { z } from "zod";

export const TradeSchema = z.object({
  id: z.string().or(z.number()),
  user_id: z.string(),
  asset_type: z.enum(["stock", "option", "futures", "crypto"]),
  symbol: z.string(),
  open_date: z.string().or(z.date()).nullable(),
  close_date: z.string().or(z.date()).nullable(),
  qty: z.number().nullable(),
  avg_entry: z.number().nullable(),
  avg_exit: z.number().nullable(),
  fees: z.number().nullable(),
  realized_pnl: z.number().nullable(),
  expiry: z.string().nullable(),
  strike: z.number().nullable(),
  option_type: z.enum(["call", "put"]).nullable(),
  contract: z.string().nullable(),
  tick_value: z.number().nullable(),
  quote_currency: z.string().nullable(),
});

export type Trade = z.infer<typeof TradeSchema>;

export async function fetchTradesForUser(userId: string, opts?: {
  limit?: number;
  cursor?: string | null;
  filters?: Record<string, unknown>;
}): Promise<{ items: Trade[]; nextCursor: string | null }> {
  const supabase = createClient();
  const limit = opts?.limit ?? 100;
  let query = supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('close_date', { ascending: false })
    .limit(limit);
  // TODO: add cursor/page support if needed
  const { data, error } = await query;
  if (error) throw error;
  const items = z.array(TradeSchema).parse(data ?? []);
  return { items, nextCursor: null };
}
