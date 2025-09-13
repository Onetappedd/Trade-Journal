'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';
import type { Database } from '@/lib/database.types';

// Explicitly use Node.js runtime to avoid Edge Runtime warnings
export const runtime = 'nodejs';

const ALLOWED_ASSET_TYPES = ['stock', 'option', 'futures', 'crypto'] as const;
type AssetType = typeof ALLOWED_ASSET_TYPES[number];

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  asset_type: z.enum(['stock', 'option', 'crypto', 'futures', 'forex']),
  side: z.enum(['buy', 'sell']),
  quantity: z.coerce.number().min(0.000001, 'Quantity must be positive'),
  entry_price: z.coerce.number().min(0, 'Entry price must be non-negative'),
  exit_price: z.coerce.number().optional(),
  entry_date: z.string(),
  exit_date: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  strike_price: z.coerce.number().optional(),
  expiry_date: z.string().optional(),
  option_type: z.enum(['call', 'put']).optional(),
});

export async function addTradeAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to add a trade.' };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const parsed = tradeSchema.safeParse({
    ...rawFormData,
    tags: formData.getAll('tags'),
  });

  if (!parsed.success) {
    return { error: 'Invalid form data.', details: parsed.error.format() };
  }

  const { data } = parsed;

  try {
    const assetType = data.asset_type as AssetType;
    if (!ALLOWED_ASSET_TYPES.includes(assetType)) {
      throw new Error('Unsupported asset_type');
    }
    const tradeData: Database['public']['Tables']['trades']['Insert'] = {
      user_id: user.id,
      symbol: data.symbol,
      instrument_type: assetType,
      group_key: `${data.symbol}-${Date.now()}`,
      opened_at: new Date(data.entry_date).toISOString(),
      qty_opened: data.quantity,
      avg_open_price: data.entry_price,
      closed_at: data.exit_date ? new Date(data.exit_date).toISOString() : null,
      qty_closed: data.exit_price ? data.quantity : 0,
      avg_close_price: data.exit_price || null,
      status: data.exit_price ? 'closed' : 'open',
      fees: 0, // Default to 0 for manual entries
    };

    const { data: newTrade, error: tradeError } = await supabase
      .from('trades')
      .insert(tradeData)
      .select()
      .single();

    if (tradeError) throw tradeError;

    // Handle tags
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        let { data: tag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .eq('user_id', user.id)
          .single();

        if (!tag) {
          const { data: newTag, error: newTagError } = await supabase
            .from('tags')
            .insert({ name: tagName, user_id: user.id })
            .select('id')
            .single();
          if (newTagError) throw newTagError;
          tag = newTag;
        }

        const { error: tradeTagError } = await (supabase as any).from('trade_tags').insert({
          trade_id: newTrade.id,
          tag_id: tag.id,
        });
        if (tradeTagError) throw tradeTagError;
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/trade-history');
    return { data: newTrade };
  } catch (error: any) {
    return { error: `Failed to add trade: ${error.message}` };
  }
}

export async function deleteTradeAction(tradeId: string) {
  const supabase = await createClient();
  const { error } = await (supabase as any).from('trades').delete().eq('id', tradeId);

  if (error) {
    return { error: `Failed to delete trade: ${error.message}` };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/trade-history');
  return { success: true };
}
