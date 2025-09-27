import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { calculateRealPortfolioValue } from '@/lib/portfolio';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return NextResponse.json({ error: 'Not authenticated', details: userError?.message }, { status: 401 });
    }

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
