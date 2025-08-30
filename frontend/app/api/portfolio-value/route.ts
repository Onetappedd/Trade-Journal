import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { calculateRealPortfolioValue } from '@/lib/portfolio';

export async function GET(req: NextRequest) {
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
    const portfolioData = await calculateRealPortfolioValue(user.id);

    return NextResponse.json(portfolioData);
  } catch (error: any) {
    console.error('Error calculating portfolio value:', error);
    return NextResponse.json(
      { error: 'Failed to calculate portfolio value', details: error.message },
      { status: 500 },
    );
  }
}
