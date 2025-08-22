import { NextRequest, NextResponse } from 'next/server';
import { polygonService } from '@/lib/polygon-api';

// Force this API route to use Node.js runtime and disable static generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { ticker: string } }) {
  try {
    const ticker = params.ticker.toUpperCase();
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    const news = await polygonService.getTickerNews(ticker, limit);

    return NextResponse.json(news, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching ticker news:', error);
    return NextResponse.json({ error: 'Failed to fetch ticker news' }, { status: 500 });
  }
}
