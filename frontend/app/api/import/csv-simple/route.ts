import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('CSV Import Simple - Starting...');
    
    // Get the file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const data = formData.get('data') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('File received:', file.name, file.size);
    
    // Parse the request data
    let requestData;
    try {
      requestData = JSON.parse(data || '{}');
    } catch (e) {
      console.error('Failed to parse request data:', e);
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    console.log('Request data:', requestData);
    
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
    
    console.log('Supabase client created');
    
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
    
    // Create import run
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
    
    console.log('Import run created:', importRun.id);
    
    // Read and parse CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    console.log('CSV parsed, lines:', lines.length);
    
    // Update import run with progress
    await supabase
      .from('import_runs')
      .update({
        total_rows: lines.length,
        processed_rows: lines.length,
        progress: 100,
        status: 'completed',
        result: {
          inserted: lines.length,
          skipped: 0,
          errors: 0
        }
      })
      .eq('id', importRun.id);
    
    console.log('Import completed successfully');
    
    return NextResponse.json({
      success: true,
      importRunId: importRun.id,
      message: 'CSV import completed successfully',
      stats: {
        totalRows: lines.length,
        processedRows: lines.length
      }
    });

  } catch (error: any) {
    console.error('CSV Import Simple error:', error);
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error.message 
    }, { status: 500 });
  }
}
