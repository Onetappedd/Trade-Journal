import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseWithToken, createSupabaseAdmin } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { unstable_cache } from 'next/cache';
import { createApiError, createApiSuccess, ERROR_CODES } from '@/src/types/api';

interface SubscriptionStatus {
  entitled: boolean;
  tier?: 'free' | 'basic' | 'pro' | 'enterprise';
  status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  features?: string[];
  limits?: {
    maxTrades?: number;
    maxImports?: number;
    maxStorage?: number;
  };
}

/**
 * Subscription Status API
 * 
 * Returns user's subscription status based on server-side lookup.
 * This is the single source of truth for premium access - never trust client flags.
 * 
 * Features:
 * - Server-side subscription verification
 * - Cached results for performance
 * - Real-time status updates
 * - Feature-based access control
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createApiError(ERROR_CODES.UNAUTHORIZED, 'No authorization token provided'),
        { status: 401 }
      );
    }

    const supabase = await createSupabaseWithToken(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createApiError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', authError?.message),
        { status: 401 }
      );
    }

    // Get cached subscription status or fetch fresh
    const subscriptionStatus = await getCachedSubscriptionStatus(user.id, supabase);

    return NextResponse.json(createApiSuccess(subscriptionStatus));

  } catch (error: any) {
    console.error('Subscription status API error:', error);
    return NextResponse.json(
      createApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch subscription status', error.message),
      { status: 500 }
    );
  }
}

/**
 * Get cached subscription status
 */
const getCachedSubscriptionStatus = unstable_cache(
  async (userId: string, supabase: any): Promise<SubscriptionStatus> => {
    return getSubscriptionStatus(userId, supabase);
  },
  ['subscription-status'],
  {
    tags: ['subscription', 'user'],
    revalidate: 60 // 1 minute cache
  }
);

/**
 * Get subscription status from database
 */
async function getSubscriptionStatus(userId: string, supabase: any): Promise<SubscriptionStatus> {
  try {
    // Get user's subscription from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        tier,
        status,
        current_period_end,
        cancel_at_period_end,
        stripe_subscription_id,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subError);
      // Return free tier on error
      return getFreeTierStatus();
    }

    if (!subscription) {
      return getFreeTierStatus();
    }

    // Get subscription features and limits
    const features = getSubscriptionFeatures(subscription.tier);
    const limits = getSubscriptionLimits(subscription.tier);

    return {
      entitled: subscription.status === 'active',
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      features,
      limits
    };

  } catch (error) {
    console.error('Error getting subscription status:', error);
    return getFreeTierStatus();
  }
}

/**
 * Get subscription features based on tier
 */
function getSubscriptionFeatures(tier: string): string[] {
  switch (tier) {
    case 'pro':
      return [
        'unlimited_trades',
        'unlimited_imports',
        'advanced_analytics',
        'custom_reports',
        'api_access',
        'priority_support',
        'data_export',
        'real_time_data'
      ];
    case 'basic':
      return [
        'limited_trades',
        'basic_imports',
        'standard_analytics',
        'email_support'
      ];
    case 'enterprise':
      return [
        'unlimited_trades',
        'unlimited_imports',
        'advanced_analytics',
        'custom_reports',
        'api_access',
        'priority_support',
        'data_export',
        'real_time_data',
        'white_label',
        'custom_integrations',
        'dedicated_support',
        'sla_guarantee'
      ];
    default:
      return ['basic_features'];
  }
}

/**
 * Get subscription limits based on tier
 */
function getSubscriptionLimits(tier: string): SubscriptionStatus['limits'] {
  switch (tier) {
    case 'pro':
      return {
        maxTrades: -1, // unlimited
        maxImports: -1, // unlimited
        maxStorage: 10 * 1024 * 1024 * 1024 // 10GB
      };
    case 'basic':
      return {
        maxTrades: 1000,
        maxImports: 10,
        maxStorage: 1024 * 1024 * 1024 // 1GB
      };
    case 'enterprise':
      return {
        maxTrades: -1, // unlimited
        maxImports: -1, // unlimited
        maxStorage: -1 // unlimited
      };
    default:
      return {
        maxTrades: 100,
        maxImports: 3,
        maxStorage: 100 * 1024 * 1024 // 100MB
      };
  }
}

/**
 * Get free tier status
 */
function getFreeTierStatus(): SubscriptionStatus {
  return {
    entitled: false,
    tier: 'free',
    status: 'active',
    features: ['basic_features'],
    limits: {
      maxTrades: 100,
      maxImports: 3,
      maxStorage: 100 * 1024 * 1024 // 100MB
    }
  };
}

/**
 * Update subscription status (called by webhook)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscriptionData } = body;

    if (!userId || !subscriptionData) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    
    // Update subscription in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        ...subscriptionData,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    // Invalidate cache
    revalidateTag('subscription');
    revalidateTag('user');

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json({ 
      error: 'Failed to update subscription', 
      details: error.message 
    }, { status: 500 });
  }
}
