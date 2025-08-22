import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { fetchTradesForUser } from '@/lib/server/trades';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ValidAsset =
  | 'stock'
  | 'option'
  | 'options'
  | 'future'
  | 'futures'
  | 'crypto';

function coerceAssetType(a?: string | null) {
  if (!a) return undefined;
  const x = a.toLowerCase();
  if ([
    'stock', 'equity', 'shares']
  ].includes(x)) return 'stock';
  if ([
    'option', 'options', 'opt']
  ].includes(x)) return 'option';
  if ([
    'future', 'futures', 'fut']
  ].includes(x)) return 'future';
  if ([
    'crypto', 'coin']
  ].includes(x)) return 'crypto';
  return undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 500);
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const symbol = url.searchParams.get('symbol') ?? undefined;
  const accountId = url.searchParams.get('accountId') ?? undefined;
  const side = url.searchParams.get('side') ?? undefined;
  const assetType = coerceAssetType(url.searchParams.get('assetType'));
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Support for filters in fetchTradesForUser
    const filters: Record<string, any> = {};
    if (symbol) filters.symbol = symbol;
    if (accountId) filters.accountId = accountId;
    if (assetType) filters.assetType = assetType === 'options' ? 'option' : assetType;
    if (side) filters.side = side;
    if (from || to) {
      filters.close_date = {};
      if (from) filters.close_date.gte = from;
      if (to) filters.close_date.lte = to;
    }

    const { items, nextCursor } = await fetchTradesForUser(userId, {
      limit,
      cursor,
      filters,
    });

    // Normalize/serialize possibly problematic types
    const serialize = (t: any) => ({
      ...t,
      qty: t.qty != null ? Number(t.qty) : null,
      avg_entry: t.avg_entry != null ? Number(t.avg_entry) : null,
      avg_exit: t.avg_exit != null ? Number(t.avg_exit) : null,
      fees: t.fees != null ? Number(t.fees) : 0,
      realized_pnl: t.realized_pnl != null ? Number(t.realized_pnl) : null,
      asset_type: coerceAssetType(t.asset_type) ?? t.asset_type,
    });

    return NextResponse.json({
      items: items.map(serialize),
      nextCursor,
    });
  } catch (err: any) {
    console.error('[api/trades] error', {
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
