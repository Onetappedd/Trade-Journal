import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== BASIC IMPORT TEST START ===');
    
    // Test 1: Check if we can receive the request
    console.log('Request received');
    
    // Test 2: Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    console.log('Environment check:', envCheck);
    
    // Test 3: Try to get FormData
    let formData;
    try {
      formData = await request.formData();
      console.log('FormData received successfully');
    } catch (e) {
      console.error('FormData error:', e);
      return NextResponse.json({ error: 'FormData parsing failed', details: e.message }, { status: 400 });
    }
    
    // Test 4: Check file
    const file = formData.get('file') as File;
    if (!file) {
      console.log('No file found in FormData');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    console.log('File found:', file.name, file.size, file.type);
    
    // Test 5: Check data
    const data = formData.get('data') as string;
    console.log('Data field:', data);
    
    // Test 6: Try to parse JSON
    let requestData;
    try {
      requestData = JSON.parse(data || '{}');
      console.log('Request data parsed:', requestData);
    } catch (e) {
      console.error('JSON parse error:', e);
      return NextResponse.json({ error: 'Invalid JSON in data field', details: e.message }, { status: 400 });
    }
    
    console.log('=== BASIC IMPORT TEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      message: 'Basic import test passed',
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      requestData,
      envCheck
    });

  } catch (error: any) {
    console.error('=== BASIC IMPORT TEST ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Basic import test failed', 
      details: error.message,
      type: error.constructor.name
    }, { status: 500 });
  }
}
