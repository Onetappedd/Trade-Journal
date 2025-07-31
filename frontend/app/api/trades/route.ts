import { NextResponse } from 'next/server';

// POST: Add a new trade (with extended documentation fields)
export async function POST(request: Request) {
  const body = await request.json();
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Dummy API] Received new trade payload:', body);
  }
  // Simulate success response with echo of received data and a dummy tradeId
  return NextResponse.json({
    success: true,
    tradeId: 'dummy-trade-id',
    ...body
  });
}
