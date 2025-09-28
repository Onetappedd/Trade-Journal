import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== WEBULL CONNECTION TEST START ===');
    
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);
    
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('import_runs')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Database test error:', testError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError.message 
      }, { status: 500 });
    }
    
    console.log('Database connection successful');
    
    // Test creating an import run
    try {
      const { data: importRunData, error: importError } = await supabase
        .from('import_runs')
        .insert({
          user_id: user.id,
          source: 'webull',
          status: 'processing'
        })
        .select()
        .single();
      
      if (importError) {
        console.error('Import run creation error:', importError);
        return NextResponse.json({ 
          error: 'Failed to create import run', 
          details: importError.message 
        }, { status: 500 });
      }
      
      console.log('Import run created successfully:', importRunData.id);
      
      // Clean up test record
      await supabase
        .from('import_runs')
        .delete()
        .eq('id', importRunData.id);
      
      return NextResponse.json({
        success: true,
        message: 'Webull connection test passed',
        userId: user.id,
        importRunId: importRunData.id
      });
      
    } catch (e) {
      console.error('Import run creation failed:', e);
      return NextResponse.json({ 
        error: 'Import run creation failed', 
        details: e.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Webull connection test error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
