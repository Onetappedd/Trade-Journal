import { createClient } from '@/lib/supabase/client';

export type UserRole = 'free' | 'pro' | 'admin';
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired';
export type AccessStatus = 'trial_active' | 'subscription_active' | 'expired';

export interface UserSubscription {
  id: string;
  email: string;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  access_status: AccessStatus;
}

export interface SubscriptionCheck {
  hasAccess: boolean;
  role: UserRole;
  status: SubscriptionStatus;
  accessStatus: AccessStatus;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  isTrialActive: boolean;
  isSubscriptionActive: boolean;
  isExpired: boolean;
  daysLeftInTrial: number | null;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_subscription_status')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error || !data) {
    return null;
  }
  
  return data;
}

export async function checkUserAccess(userId: string, requiredRole: UserRole = 'free'): Promise<SubscriptionCheck> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return {
      hasAccess: false,
      role: 'free',
      status: 'expired',
      accessStatus: 'expired',
      trialEndsAt: null,
      subscriptionEndsAt: null,
      isTrialActive: false,
      isSubscriptionActive: false,
      isExpired: true,
      daysLeftInTrial: null
    };
  }
  
  const now = new Date();
  const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const subscriptionEndsAt = subscription.subscription_ends_at ? new Date(subscription.subscription_ends_at) : null;
  
  const isTrialActive = subscription.subscription_status === 'trial' && trialEndsAt && trialEndsAt > now;
  const isSubscriptionActive = subscription.subscription_status === 'active' && 
    (!subscriptionEndsAt || subscriptionEndsAt > now);
  const isExpired = !isTrialActive && !isSubscriptionActive;
  
  const daysLeftInTrial = isTrialActive && trialEndsAt 
    ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Check access based on role and subscription status
  let hasAccess = false;
  
  if (subscription.role === 'admin') {
    hasAccess = true;
  } else if (requiredRole === 'free') {
    hasAccess = isTrialActive || isSubscriptionActive;
  } else if (requiredRole === 'pro') {
    hasAccess = (subscription.role === 'pro' || subscription.role === 'admin') && 
                (isTrialActive || isSubscriptionActive);
  } else if (requiredRole === 'admin') {
    hasAccess = subscription.role === 'admin';
  }
  
  return {
    hasAccess,
    role: subscription.role,
    status: subscription.subscription_status,
    accessStatus: subscription.access_status,
    trialEndsAt,
    subscriptionEndsAt,
    isTrialActive,
    isSubscriptionActive,
    isExpired,
    daysLeftInTrial
  };
}

export async function upgradeToPro(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  // This would typically integrate with Stripe
  // For now, we'll just update the user role
  const { error } = await supabase
    .from('profiles')
    .update({ 
      role: 'pro',
      subscription_status: 'active',
      subscription_ends_at: null // Set to null for ongoing subscription
    })
    .eq('id', userId);
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

export async function cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  // This would typically integrate with Stripe
  const { error } = await supabase
    .from('profiles')
    .update({ 
      subscription_status: 'cancelled',
      subscription_ends_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

export function formatTrialDays(days: number): string {
  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return '1 day';
  } else {
    return `${days} days`;
  }
}

export function getSubscriptionFeatures(role: UserRole): string[] {
  const features = {
    free: [
      'Up to 100 trades per month',
      'Basic P&L tracking',
      'CSV import (up to 1,000 rows)',
      'Email support'
    ],
    pro: [
      'Unlimited trades',
      'Advanced analytics & charts',
      'All import formats (CSV, Excel, IBKR Flex)',
      'Options lifecycle tracking',
      'Portfolio performance metrics',
      'Priority support',
      'API access',
      'Custom reports'
    ],
    admin: [
      'All Pro features',
      'Admin dashboard',
      'User management',
      'System monitoring',
      'Database access'
    ]
  };
  
  return features[role] || features.free;
}
