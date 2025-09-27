import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

/**
 * Test API endpoint for E2E testing
 * 
 * Security measures:
 * - Only enabled when NODE_ENV === 'test' or E2E_TEST === 'true'
 * - Returns 404 in production environments
 * - Relies on RLS (auth.uid()) to ensure only authenticated user's data is accessible
 * - Requires valid JWT token in Authorization header
 */
export async function GET(request: NextRequest) {
  try {
    // Environment protection - only allow in test environments
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
    if (!isTestEnv) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const authHeader = request.headers.get('authorization');
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

    // Get current user - RLS will ensure only their data is accessible
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    // Get user profile - RLS ensures only the authenticated user's profile is returned
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile', details: profileError.message }, { status: 500 });
    }

    // Return only the essential profile data for testing
    return NextResponse.json({
      id: user.id,
      email: user.email,
      display_name: profile.display_name,
      username: profile.username,
      timezone: profile.timezone,
      default_broker: profile.default_broker,
      default_asset_type: profile.default_asset_type,
      risk_tolerance: profile.risk_tolerance,
      email_notifications: profile.email_notifications,
      push_notifications: profile.push_notifications,
      trade_alerts: profile.trade_alerts,
      weekly_reports: profile.weekly_reports,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    });
  } catch (error: any) {
    console.error('Test API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
