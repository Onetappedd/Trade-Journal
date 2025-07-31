import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const { symbol } = params;
  try {
    const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${api_url}/market/quote/${symbol}`);
    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ error: errorData.detail || 'Failed to fetch quote' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
