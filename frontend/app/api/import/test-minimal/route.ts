import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('=== MINIMAL TEST START ===');
  
  try {
    // Just return success without doing anything
    return NextResponse.json({
      success: true,
      message: 'Minimal test passed - no database operations',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Minimal test error:', error);
    return NextResponse.json({ 
      error: 'Minimal test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
