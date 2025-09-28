import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing simple API route...');
    
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    console.log('Auth header found, creating Supabase client...');
    const supabase = createSupabaseWithToken(request);

    console.log('Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Test database connection with a simple query
    console.log('Testing database connection...');
    const { data, error } = await supabase
      .from('import_runs')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('Database connection successful');

    return NextResponse.json({
      success: true,
      message: 'Simple test successful',
      user: user.id,
      database: 'connected'
    });

  } catch (error: any) {
    console.error('Simple test error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
