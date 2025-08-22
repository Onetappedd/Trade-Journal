import { NextRequest, NextResponse } from 'next/server';
import { getTrades } from '@/lib/trades';
import { getUserIdFromRequest } from '@/lib/auth'; // IMPLEMENT OR ADJUST based on your auth setup

export async function GET(req: NextRequest) {
  // Require auth
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Paging, sorting, filtering from query params
  const url = req.nextUrl;
  const page = url.searchParams.get('page');
  const pageSize = url.searchParams.get('pageSize');
  const sortField = url.searchParams.get('sortField');
  const sortDir = url.searchParams.get('sortDir') as 'asc' | 'desc' | undefined;
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');
  const assetTypes = url.searchParams.get('assetTypes')?.split(',').filter(Boolean) || undefined;
  const status = url.searchParams.get('status')?.split(',').filter(Boolean) as any;
  const symbol = url.searchParams.get('symbol') || undefined;
  const text = url.searchParams.get('q') || undefined;

  try {
    const result = await getTrades({
      userId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sort: sortField ? { field: sortField, dir: sortDir || 'desc' } : undefined,
      dateFrom,
      dateTo,
      assetTypes,
      status,
      symbol,
      text,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch trades' }, { status: 500 });
  }
}
