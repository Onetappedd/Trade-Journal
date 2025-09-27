import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    // For now, return mock notifications
    // In the future, this could fetch from a notifications table
    const notifications = [
      {
        id: '1',
        type: 'success',
        title: 'Trade Executed Successfully',
        message: 'Your buy order for 100 shares of AAPL has been filled at $185.50',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        actionUrl: '/trades'
      },
      {
        id: '2',
        type: 'info',
        title: 'Market Alert',
        message: 'TSLA has moved 5% in the last hour',
        isRead: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        actionUrl: '/analytics'
      },
      {
        id: '3',
        type: 'warning',
        title: 'Risk Management Alert',
        message: 'Your portfolio is approaching the daily loss limit',
        isRead: true,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        actionUrl: '/dashboard'
      },
      {
        id: '4',
        type: 'success',
        title: 'Monthly Report Ready',
        message: 'Your trading performance report for March is now available',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        actionUrl: '/analytics'
      }
    ];

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    const { notificationId, action } = await request.json();

    // For now, just return success
    // In the future, this could mark notifications as read in the database
    if (action === 'markAsRead' && notificationId) {
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    if (action === 'markAllAsRead') {
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

