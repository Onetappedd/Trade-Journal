import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing import API...');
    
    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    
    console.log('Environment check:', envCheck);
    
    // Test Supabase connection
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
    
    console.log('Supabase client created');
    
    // Test database connection
    const { data, error } = await supabase
      .from('import_runs')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: error.message,
        envCheck 
      }, { status: 500 });
    }
    
    console.log('Database connection successful');
    
    return NextResponse.json({
      success: true,
      message: 'Import test successful',
      envCheck,
      database: 'connected'
    });

  } catch (error: any) {
    console.error('Import test error:', error);
    return NextResponse.json({ 
      error: 'Import test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
