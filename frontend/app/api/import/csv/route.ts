import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if auth.uid() works in server context
    const { data: authCheck } = await supabase.rpc('get_current_user_id');
    console.log('Server-side auth.uid():', authCheck);

    const body = await request.json();
    const { fileName, fileSize, usePreset, detectedPreset, timezone } = body;

    // Create import run
    const { data: runData, error: runError } = await supabase
      .from('import_runs')
      .insert({
        user_id: user.id,
        source: usePreset ? detectedPreset?.id || 'csv' : 'csv',
        status: 'processing'
      })
      .select('id')
      .single();

    if (runError) {
      console.error('Error creating import run:', runError);
      return NextResponse.json({ error: 'Failed to create import run' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      runId: runData.id,
      authCheck 
    });

  } catch (error) {
    console.error('CSV import API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
