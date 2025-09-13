import { getServerSupabase } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export type UserRole = 'free' | 'pro' | 'admin';

/**
 * Server-side function to check if a user has access to a specific feature
 * This should be used in API routes to gate Pro features
 */
export async function checkServerAccess(
  request: NextRequest,
  requiredRole: UserRole = 'free'
): Promise<{ hasAccess: boolean; userId: string | null; error?: string }> {
  try {
    const supabase = getServerSupabase();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { hasAccess: false, userId: null, error: 'Unauthorized' };
    }

    // Check user subscription status
    const { data: subscription, error: subError } = await supabase
      .from('user_subscription_status')
      .select('role, subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single();

    if (subError || !subscription) {
      return { hasAccess: false, userId: user.id, error: 'Subscription not found' };
    }

    const now = new Date();
    const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
    const subscriptionEndsAt = subscription.subscription_ends_at ? new Date(subscription.subscription_ends_at) : null;
    
    const isTrialActive = Boolean(
      subscription.subscription_status === 'trial' && 
      trialEndsAt && 
      trialEndsAt > now
    );
    
    const isSubscriptionActive = Boolean(
      subscription.subscription_status === 'active' && 
      (!subscriptionEndsAt || subscriptionEndsAt > now)
    );
    
    const isExpired = !isTrialActive && !isSubscriptionActive;

    // Check access based on role and subscription status
    let hasAccess = false;
    
    if (subscription.role === 'admin') {
      hasAccess = true;
    } else if (requiredRole === 'free') {
      hasAccess = isTrialActive || isSubscriptionActive;
    } else if (requiredRole === 'pro') {
      hasAccess = subscription.role === 'pro' && (isTrialActive || isSubscriptionActive);
    }

    return { hasAccess, userId: user.id };
  } catch (error) {
    console.error('Error checking server access:', error);
    return { hasAccess: false, userId: null, error: 'Internal server error' };
  }
}

/**
 * Server-side function to require Pro access
 * Throws an error if user doesn't have Pro access
 */
export async function requireProAccess(request: NextRequest): Promise<{ userId: string }> {
  const { hasAccess, userId, error } = await checkServerAccess(request, 'pro');
  
  if (!hasAccess || !userId) {
    throw new Error(error || 'Pro access required');
  }
  
  return { userId };
}

/**
 * Server-side function to require admin access
 * Throws an error if user doesn't have admin access
 */
export async function requireAdminAccess(request: NextRequest): Promise<{ userId: string }> {
  const { hasAccess, userId, error } = await checkServerAccess(request, 'admin');
  
  if (!hasAccess || !userId) {
    throw new Error(error || 'Admin access required');
  }
  
  return { userId };
}

/**
 * Server-side function to check if user has any valid access (trial or subscription)
 */
export async function requireValidAccess(request: NextRequest): Promise<{ userId: string }> {
  const { hasAccess, userId, error } = await checkServerAccess(request, 'free');
  
  if (!hasAccess || !userId) {
    throw new Error(error || 'Valid access required');
  }
  
  return { userId };
}

/**
 * Helper function to create a proper error response for access denied
 */
export function createAccessDeniedResponse(message: string = 'Access denied') {
  return new Response(
    JSON.stringify({ 
      error: message,
      code: 'ACCESS_DENIED'
    }), 
    { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Helper function to create a proper error response for subscription required
 */
export function createSubscriptionRequiredResponse() {
  return new Response(
    JSON.stringify({ 
      error: 'Pro subscription required for this feature',
      code: 'SUBSCRIPTION_REQUIRED',
      upgradeUrl: '/dashboard/billing'
    }), 
    { 
      status: 402,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
