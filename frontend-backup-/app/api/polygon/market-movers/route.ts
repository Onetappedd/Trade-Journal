import { NextRequest, NextResponse } from 'next/server';
import { polygonService } from '@/lib/polygon-api';

// Force this API route to use Node.js runtime and disable static generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const direction = (searchParams.get('direction') as 'gainers' | 'losers') || 'gainers';

    const movers = await polygonService.getMarketMovers(direction);

    return NextResponse.json(movers, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching market movers:', error);
    return NextResponse.json({ error: 'Failed to fetch market movers' }, { status: 500 });
  }
}
