import { NextResponse } from 'next/server';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Riskr API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
}
