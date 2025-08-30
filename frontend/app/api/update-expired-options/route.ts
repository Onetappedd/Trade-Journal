import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { updateExpiredOptionsTrades } from '@/lib/trades/updateExpiredOptions';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const result = await updateExpiredOptionsTrades(user.id, supabase);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error updating expired options:', error);
    return NextResponse.json(
      { error: 'Failed to update expired options', details: error.message },
      { status: 500 },
    );
  }
}

// GET endpoint for convenience
export async function GET(req: NextRequest) {
  return POST(req);
}
