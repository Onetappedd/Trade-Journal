import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { debugRouteGuard } from '@/lib/route-guards';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Guard: Only allow in development or when explicitly enabled
  const guardResponse = debugRouteGuard();
  if (guardResponse) return guardResponse;
  
  try {
    console.log('=== DEBUG IMPORT START ===');
    
    // Step 1: Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    console.log('Environment check:', envCheck);
    
    if (!envCheck.supabaseUrl || !envCheck.supabaseAnonKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase environment variables',
        envCheck 
      }, { status: 500 });
    }
    
    // Step 2: Test Supabase client creation
    let supabase;
    try {
      const cookieStore = cookies();
      supabase = createServerClient(
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
      console.log('Supabase client created successfully');
    } catch (e) {
      console.error('Supabase client creation failed:', e);
      return NextResponse.json({ 
        error: 'Failed to create Supabase client', 
        details: e instanceof Error ? e.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Step 3: Test authentication
    let user;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        return NextResponse.json({ 
          error: 'Authentication failed', 
          details: authError.message 
        }, { status: 401 });
      }
      user = authUser;
      console.log('User authenticated:', user?.id);
    } catch (e) {
      console.error('Auth check failed:', e);
      return NextResponse.json({ 
        error: 'Auth check failed', 
        details: e instanceof Error ? e.message : 'Unknown error'
      }, { status: 500 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No authenticated user' 
      }, { status: 401 });
    }
    
    // Step 4: Test database connection
    try {
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
    } catch (e) {
      console.error('Database test failed:', e);
      return NextResponse.json({ 
        error: 'Database test failed', 
        details: e instanceof Error ? e.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Step 5: Test FormData parsing
    let formData;
    try {
      formData = await request.formData();
      console.log('FormData received successfully');
    } catch (e) {
      console.error('FormData error:', e);
      return NextResponse.json({ error: 'FormData parsing failed', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 400 });
    }
    
    // Step 6: Test file handling
    const file = formData.get('file') as File;
    if (!file) {
      console.log('No file found in FormData');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    console.log('File found:', file.name, file.size, file.type);
    
    // Step 7: Test data field
    const data = formData.get('data') as string;
    console.log('Data field:', data);
    
    let requestData;
    try {
      requestData = JSON.parse(data || '{}');
      console.log('Request data parsed:', requestData);
    } catch (e) {
      console.error('JSON parse error:', e);
      return NextResponse.json({ error: 'Invalid JSON in data field', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 400 });
    }
    
    // Step 8: Test import_runs table creation
    try {
      const { data: importRun, error: importError } = await supabase
        .from('import_runs')
        .insert({
          user_id: user.id,
          source: 'csv',
          status: 'processing',
          file_name: file.name,
          file_size: file.size,
          total_rows: 0,
          processed_rows: 0,
          progress: 0,
          options: requestData.options || {}
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
      
      console.log('Import run created successfully:', importRun.id);
      
      // Clean up the test import run
      await supabase
        .from('import_runs')
        .delete()
        .eq('id', importRun.id);
      
    } catch (e) {
      console.error('Import run creation failed:', e);
      return NextResponse.json({ 
        error: 'Import run creation failed', 
        details: e instanceof Error ? e.message : 'Unknown error'
      }, { status: 500 });
    }
    
    console.log('=== DEBUG IMPORT SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      message: 'All debug tests passed',
      envCheck,
      userId: user.id,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      requestData
    });

  } catch (error: any) {
    console.error('=== DEBUG IMPORT ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Debug import test failed', 
      details: error.message,
      type: error.constructor.name
    }, { status: 500 });
  }
}
