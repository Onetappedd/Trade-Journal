import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth';
import { checkUserAccess, getUserSubscription, type UserRole } from '@/lib/subscription';

export interface Entitlements {
  plan: UserRole;
  features: string[];
  isLoaded: boolean;
  hasAccess: boolean;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
  accessStatus: 'trial_active' | 'subscription_active' | 'expired';
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  isTrialActive: boolean;
  isSubscriptionActive: boolean;
  isExpired: boolean;
  daysLeftInTrial: number | null;
}

export interface FeatureGate {
  [key: string]: {
    requiredRole: UserRole;
    description: string;
  };
}

// Define feature gates for the application
export const FEATURE_GATES: FeatureGate = {
  // Basic features (free tier)
  'basic-trades': {
    requiredRole: 'free',
    description: 'Basic trade tracking and CSV import'
  },
  'basic-analytics': {
    requiredRole: 'free',
    description: 'Basic P&L tracking and charts'
  },
  
  // Pro features
  'unlimited-trades': {
    requiredRole: 'pro',
    description: 'Unlimited trade imports and storage'
  },
  'advanced-analytics': {
    requiredRole: 'pro',
    description: 'Advanced analytics, options lifecycle tracking'
  },
  'api-access': {
    requiredRole: 'pro',
    description: 'API access for external integrations'
  },
  'custom-reports': {
    requiredRole: 'pro',
    description: 'Custom report generation'
  },
  
  // Admin features
  'admin-dashboard': {
    requiredRole: 'admin',
    description: 'Admin dashboard and user management'
  },
  'system-monitoring': {
    requiredRole: 'admin',
    description: 'System monitoring and database access'
  }
};

/**
 * Hook for checking user entitlements and feature access
 * Wraps the existing subscription logic for consistent API
 */
export function useEntitlements(): Entitlements | null {
  const { user } = useAuth();
  
  const { data: entitlements, isLoading } = useQuery({
    queryKey: ['entitlements', user?.id],
    queryFn: async (): Promise<Entitlements> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const subscription = await checkUserAccess(user.id);
      
      return {
        plan: subscription.role,
        features: getFeaturesForRole(subscription.role),
        isLoaded: true,
        hasAccess: subscription.hasAccess,
        status: subscription.status,
        accessStatus: subscription.accessStatus,
        trialEndsAt: subscription.trialEndsAt,
        subscriptionEndsAt: subscription.subscriptionEndsAt,
        isTrialActive: subscription.isTrialActive,
        isSubscriptionActive: subscription.isSubscriptionActive,
        isExpired: subscription.isExpired,
        daysLeftInTrial: subscription.daysLeftInTrial,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
  
  if (isLoading || !entitlements) {
    return null;
  }
  
  return entitlements;
}

/**
 * Hook for checking if user has access to a specific feature
 */
export function useFeatureAccess(featureKey: keyof typeof FEATURE_GATES): boolean {
  const entitlements = useEntitlements();
  
  if (!entitlements) {
    return false;
  }
  
  const feature = FEATURE_GATES[featureKey];
  if (!feature) {
    return false;
  }
  
  return hasRoleAccess(entitlements.plan, feature.requiredRole);
}

/**
 * Hook for checking if user has a specific role or higher
 */
export function useRoleAccess(requiredRole: UserRole): boolean {
  const entitlements = useEntitlements();
  
  if (!entitlements) {
    return false;
  }
  
  return hasRoleAccess(entitlements.plan, requiredRole);
}

/**
 * Helper function to get features for a specific role
 */
function getFeaturesForRole(role: UserRole): string[] {
  const features: string[] = [];
  
  // Add features based on role hierarchy
  Object.entries(FEATURE_GATES).forEach(([key, feature]) => {
    if (hasRoleAccess(role, feature.requiredRole)) {
      features.push(key);
    }
  });
  
  return features;
}

/**
 * Helper function to check if a user's role has access to a required role
 */
function hasRoleAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    'free': 1,
    'pro': 2,
    'admin': 3,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Utility function to get feature description
 */
export function getFeatureDescription(featureKey: keyof typeof FEATURE_GATES): string {
  return FEATURE_GATES[featureKey]?.description || 'Unknown feature';
}

/**
 * Utility function to get required role for a feature
 */
export function getFeatureRequiredRole(featureKey: keyof typeof FEATURE_GATES): UserRole {
  return FEATURE_GATES[featureKey]?.requiredRole || 'free';
}
