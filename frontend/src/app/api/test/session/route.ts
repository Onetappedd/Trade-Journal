import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';
import { isTestEnv, isImportV2Enabled } from '@/lib/env';

/**
 * Test-only debug API to introspect auth + flags
 * Only enabled when NEXT_PUBLIC_E2E_TEST=true
 */
export async function GET(request: NextRequest) {
  try {
    // Environment protection - only allow in test environments
    if (!isTestEnv() || process.env.NODE_ENV === 'production') {
      return new Response('Not found', { status: 404 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        ok: false, 
        error: 'No authorization token provided' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createSupabaseWithToken(token);

    // Get current user - RLS will ensure only their data is accessible
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Unauthorized', 
        details: authError?.message 
      }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: { 
        id: user.id, 
        email: user.email 
      },
      flags: { 
        IMPORT_V2: isImportV2Enabled(), 
        IS_E2E: isTestEnv() 
      },
      now: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Test session API error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
