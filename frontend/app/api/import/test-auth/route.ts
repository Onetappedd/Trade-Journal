import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== AUTH TEST START ===');
    
    // Test environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment variables:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase environment variables' 
      }, { status: 500 });
    }
    
    // Test Supabase client creation
    let supabase;
    try {
      const cookieStore = cookies();
      supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
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
        details: e.message 
      }, { status: 500 });
    }
    
    // Test authentication
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
        details: e.message 
      }, { status: 500 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No authenticated user' 
      }, { status: 401 });
    }
    
    console.log('=== AUTH TEST SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      message: 'Auth test passed',
      userId: user.id,
      userEmail: user.email
    });

  } catch (error: any) {
    console.error('=== AUTH TEST ERROR ===');
    console.error('Error:', error);
    
    return NextResponse.json({ 
      error: 'Auth test failed', 
      details: error.message 
    }, { status: 500 });
  }
}
