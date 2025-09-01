import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const USERNAME_REGEX = /^[a-z0-9]{3,15}$/;

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')?.toLowerCase() || '';
  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      { available: false, error: 'invalid_username_format' },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    },
  );

  // Prefer calling a SECURITY DEFINER RPC to avoid exposing table reads via RLS
  const { data, error } = await supabase.rpc('username_available', { u: username } as any);

  if (error) {
    return NextResponse.json({ available: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ available: Boolean(data) });
}
