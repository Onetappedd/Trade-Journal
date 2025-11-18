import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { debugRouteGuard } from '@/lib/route-guards';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Guard: Only allow in development or when explicitly enabled
  const guardResponse = debugRouteGuard();
  if (guardResponse) return guardResponse;
  
  try {
    const supabase = getServerSupabase();

    // Test the connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
    });
  }
}
