// app/api/trades/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toPlain(value: any): any {
  if (typeof value === 'bigint') return Number(value);
  if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
    try { return value.toNumber(); } catch { return Number(value as unknown as string); }
  }
  if (Array.isArray(value)) return value.map(toPlain);
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const k of Object.keys(value)) out[k] = toPlain(value[k]);
    return out;
  }
  return value;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? '100'), 500);
    const cursor = searchParams.get('cursor') || undefined;
    const asset = searchParams.get('asset');
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where: any = { userId };
    if (asset && asset !== 'all') where.assetType = asset.toUpperCase();
    if (dateFrom || dateTo) {
      where.openedAt = {};
      if (dateFrom) where.openedAt.gte = new Date(dateFrom);
      if (dateTo) where.openedAt.lte = new Date(dateTo);
    }

    const trades = await prisma.trade.findMany({
      where,
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { openedAt: 'desc' },
    });
    const nextCursor = trades.length === limit ? trades[trades.length - 1].id : null;
    const items = toPlain(trades);
    return NextResponse.json({ items, nextCursor }, { status: 200 });
  } catch (err: any) {
    console.error('[/api/trades] error', err);
    return NextResponse.json({ error: 'Failed to load trades' }, { status: 500 });
  }
}
