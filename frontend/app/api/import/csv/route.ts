import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with the JWT token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if auth.uid() works in server context
    const { data: authCheck, error: authError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    console.log('Server-side auth check:', { authCheck, authError });

    const body = await request.json();
    const { fileName, fileSize, usePreset, detectedPreset } = body;

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
      authCheck: !!authCheck,
      user: { id: user.id, email: user.email }
    });

  } catch (error) {
    console.error('CSV import API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
