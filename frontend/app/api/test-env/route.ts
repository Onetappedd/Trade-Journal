import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'Environment check complete'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Environment check failed', 
      details: error.message 
    }, { status: 500 });
  }
}
