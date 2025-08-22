// app/api/trades/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Decimalish = { toNumber?: () => number } | number | string | bigint | null;

function toPlain(value: any): any {
  // Convert Prisma Decimal/BigInt to JSON-safe numbers
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

// —— AUTH: wire up real implementation here ——
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
async function getUserId(): Promise<string | null> {
  const s = await getServerSession(authOptions);
  return s?.user?.id ?? null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? '100'), 500);
    const cursor = searchParams.get('cursor') || undefined;
    const asset = searchParams.get('asset'); // 'stock' | 'options' | 'futures' | 'crypto' | 'all'
    const dateFrom = searchParams.get('from'); // ISO optional
    const dateTo = searchParams.get('to');     // ISO optional

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where: any = { userId };

    if (asset && asset !== 'all') {
      // Adjust field if your prisma model differs (e.g. assetType)
      where.assetClass = asset.toUpperCase();
    }
    if (dateFrom || dateTo) {
      where.executedAt = {};
      if (dateFrom) where.executedAt.gte = new Date(dateFrom);
      if (dateTo) where.executedAt.lte = new Date(dateTo);
    }

    const trades = await prisma.trade.findMany({
      where,
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { executedAt: 'desc' },
      include: {
        legs: true,
        fills: true,
      },
    });

    const nextCursor = trades.length === limit ? trades[trades.length - 1].id : null;
    const items = toPlain(trades);
    return NextResponse.json({ items, nextCursor }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/trades failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
