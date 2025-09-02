import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = getServerSupabase();
    
    // Test 1: Basic connection
    const connectionStart = Date.now();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const connectionTime = Date.now() - connectionStart;
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: userError.message,
        connectionTime 
      }, { status: 500 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No user', 
        connectionTime 
      }, { status: 401 });
    }
    
    // Test 2: Check temp_uploads table
    const tableStart = Date.now();
    const { data: tableData, error: tableError } = await supabase
      .from('temp_uploads')
      .select('count(*)')
      .limit(1);
    const tableTime = Date.now() - tableStart;
    
    // Test 3: Check storage bucket
    const storageStart = Date.now();
    const { data: bucketData, error: bucketError } = await supabase.storage
      .listBuckets();
    const storageTime = Date.now() - storageStart;
    
    // Test 4: Simple insert (will fail due to RLS but shows if table is accessible)
    const insertStart = Date.now();
    const { error: insertError } = await supabase
      .from('temp_uploads')
      .insert({
        token: 'test-token',
        user_id: user.id,
        filename: 'test.csv',
        file_type: 'csv',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
    const insertTime = Date.now() - insertStart;
    
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      user: { id: user.id },
      timing: {
        connection: connectionTime,
        tableCheck: tableTime,
        storageCheck: storageTime,
        insertTest: insertTime,
        total: totalTime
      },
      results: {
        tableExists: !tableError,
        tableError: tableError?.message,
        storageAccessible: !bucketError,
        storageError: bucketError?.message,
        insertResult: insertError ? 'Failed (expected due to RLS)' : 'Unexpected success',
        insertError: insertError?.message
      }
    });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      totalTime
    }, { status: 500 });
  }
}
