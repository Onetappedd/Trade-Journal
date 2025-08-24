// frontend/app/api/trades/route.ts
import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getTrades, type TradeListParams } from '@/lib/trades-server';

export const runtime = 'nodejs';

function parseParams(url: URL): Omit<TradeListParams, 'userId'> {
  const page = Number(url.searchParams.get('page') ?? '1');
  const pageSize = Number(url.searchParams.get('pageSize') ?? '50');
  const accountId = url.searchParams.get('accountId') || undefined;
  const symbol = url.searchParams.get('symbol') || undefined;
  const dateFrom = url.searchParams.get('dateFrom') || undefined;
  const dateTo = url.searchParams.get('dateTo') || undefined;

  // allow multiple values
  const assetTypeParams = url.searchParams.getAll('assetType');
  const sideParams = url.searchParams.getAll('side');
  const assetType = assetTypeParams.length ? assetTypeParams : undefined;
  const side = sideParams.length ? sideParams : undefined;

  return { accountId, symbol, assetType, side, dateFrom, dateTo, page, pageSize };
}

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const params = parseParams(url);
    const result = await getTrades({ ...params, userId });
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/trades error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
