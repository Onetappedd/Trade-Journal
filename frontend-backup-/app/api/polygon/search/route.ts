import { NextRequest, NextResponse } from 'next/server';
import { polygonService } from '@/lib/polygon-api';

// Force this API route to use Node.js runtime and disable static generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');

    if (!query || query.length < 1) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const results = await polygonService.searchTickers(query);

    // Filter for active stocks only
    const filteredResults = results
      .filter((ticker) => ticker.active && ticker.market === 'stocks')
      .slice(0, 20)
      .map((ticker) => ({
        symbol: ticker.ticker,
        name: ticker.name,
        type: ticker.type,
        exchange: ticker.primary_exchange,
        currency: ticker.currency_name,
      }));

    return NextResponse.json(filteredResults, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error searching tickers:', error);
    return NextResponse.json({ error: 'Failed to search tickers' }, { status: 500 });
  }
}
