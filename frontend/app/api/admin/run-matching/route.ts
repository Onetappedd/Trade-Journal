import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { matchUserTrades } from '@/lib/matching/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const userId = request.nextUrl.searchParams.get('userId');
  
  if (key !== 'riskr-admin-fix') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  // Create admin client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    console.log(`Running matching for user ${userId}...`);
    const result = await matchUserTrades({ userId, supabase });
    console.log('Matching result:', result);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Matching error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

