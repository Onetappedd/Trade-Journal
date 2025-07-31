import { NextResponse } from 'next/server';

// PUT: Update an existing trade (with extended documentation fields)
export async function PUT(request: Request, { params }: { params: { tradeId: string } }) {
  const body = await request.json();
  const { tradeId } = params;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Dummy API] Received update for tradeId ${tradeId}:`, body);
  }
  // Simulate success response with echo of received data
  return NextResponse.json({
    success: true,
    tradeId,
    ...body
  });
}
