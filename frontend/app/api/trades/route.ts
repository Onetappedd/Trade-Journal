export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ASSET_TYPES } from '@/lib/enums';
import { getServerSupabase } from '@/lib/supabase/server';

const schema = z.object({
  limit: z.preprocess(v => Number(v), z.number().int().min(1).max(100)).default(100),
  offset: z.preprocess(v => Number(v), z.number().int().min(0)).default(0),
  asset: z.string().refine(val => ASSET_TYPES.includes(val as any)).optional(),
  symbol: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());

  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const { limit, offset, asset, symbol, from, to } = parsed.data;

  try {
    let q = supabase
      .from('trades')
      .select('id,user_id,symbol,asset_type,broker,side,status,quantity,entry_price,exit_price,entry_date,exit_date,pnl,fees,strike_price,expiration_date,option_type,underlying,multiplier,currency,fees_currency,notes', { count: 'exact' })
      .eq('user_id', user.id);

    if (asset) q = q.eq('asset_type', asset);
    if (symbol) q = q.ilike('symbol', `%${symbol}%`);
    if (from) q = q.gte('entry_date', from);
    if (to) q = q.lte('entry_date', to);

    q = q.order('entry_date', { ascending: false }).range(offset, offset + limit - 1);

    const { data: items, error, count } = await q;

    if (error) {
      return NextResponse.json({ message: 'Error fetching trades', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ items, total: count });
  } catch (error: any) {
    return NextResponse.json({ message: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}
