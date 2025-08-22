// TODO: Integrate with database persistence layer
// This is a stub API that validates the trade schema and echoes back the data
// Replace the echo logic with actual database writes when ready

import { NextRequest, NextResponse } from 'next/server';
import { TradeSchema } from '@/types/trade';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the trade data against the schema
    const validatedTrade = TradeSchema.parse(body);
    
    // Generate server-side metadata
    const tradeWithMetadata = {
      ...validatedTrade,
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
    };
    
    // TODO: Save to database here
    // const savedTrade = await db.trades.create({ data: tradeWithMetadata });
    
    // For now, just echo back the validated trade with metadata
    return NextResponse.json(tradeWithMetadata, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return validation errors
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }
    
    // Generic error response
    console.error('Trade API error:', error);
    return NextResponse.json(
      { error: 'Failed to process trade' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // TODO: Implement trade fetching when database is connected
  return NextResponse.json(
    { message: 'GET /api/trades not yet implemented' },
    { status: 501 }
  );
}