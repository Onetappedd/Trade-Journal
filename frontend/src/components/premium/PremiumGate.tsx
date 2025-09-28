'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap, Star } from 'lucide-react';
import Link from 'next/link';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
  tier: 'basic' | 'pro' | 'enterprise';
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

interface SubscriptionStatus {
  entitled: boolean;
  tier?: string;
  status?: string;
  features?: string[];
  limits?: {
    maxTrades?: number;
    maxImports?: number;
    maxStorage?: number;
  };
}

/**
 * Premium Gate Component
 * 
 * Gates premium features based on server-side subscription verification.
 * Never trusts client-side flags - always fetches from server.
 * 
 * Features:
 * - Server-side subscription verification
 * - Feature-based access control
 * - Upgrade prompts for non-premium users
 * - Graceful fallbacks
 */
export function PremiumGate({ 
  children, 
  feature, 
  tier, 
  fallback,
  showUpgrade = true 
}: PremiumGateProps) {
  return <PremiumGateClient 
    children={children}
    feature={feature}
    tier={tier}
    fallback={fallback}
    showUpgrade={showUpgrade}
  />;
}

/**
 * Client-side premium gate for dynamic content
 */
export function PremiumGateClient({ 
  children, 
  feature, 
  tier, 
  fallback,
  showUpgrade = true 
}: PremiumGateProps) {
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/me/subscription', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-slate-800/50 h-32 rounded-lg" />;
  }

  if (!subscriptionStatus) {
    return fallback || null;
  }

  const hasAccess = checkFeatureAccess(subscriptionStatus, feature, tier);
  
  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgrade) {
    return <UpgradePrompt tier={tier} feature={feature} />;
  }

  return null;
}

/**
 * Check if user has access to a feature
 */
function checkFeatureAccess(
  subscription: SubscriptionStatus, 
  feature: string, 
  requiredTier: string
): boolean {
  if (!subscription.entitled) {
    return false;
  }

  // Check if user has the required tier
  const tierHierarchy = ['free', 'basic', 'pro', 'enterprise'];
  const userTierIndex = tierHierarchy.indexOf(subscription.tier || 'free');
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
  
  if (userTierIndex < requiredTierIndex) {
    return false;
  }

  // Check if feature is explicitly available
  if (subscription.features && !subscription.features.includes(feature)) {
    return false;
  }

  return true;
}

/**
 * Upgrade prompt component
 */
function UpgradePrompt({ tier, feature }: { tier: string; feature: string }) {
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'basic':
        return {
          name: 'Basic',
          icon: <Star className="h-5 w-5" />,
          color: 'bg-blue-600',
          description: 'Essential features for casual traders'
        };
      case 'pro':
        return {
          name: 'Pro',
          icon: <Crown className="h-5 w-5" />,
          color: 'bg-purple-600',
          description: 'Advanced features for serious traders'
        };
      case 'enterprise':
        return {
          name: 'Enterprise',
          icon: <Zap className="h-5 w-5" />,
          color: 'bg-gold-600',
          description: 'Premium features for professional traders'
        };
      default:
        return {
          name: 'Premium',
          icon: <Lock className="h-5 w-5" />,
          color: 'bg-slate-600',
          description: 'Premium features'
        };
    }
  };

  const tierInfo = getTierInfo(tier);

  return (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Lock className="h-6 w-6 text-slate-400" />
          <CardTitle className="text-slate-200">Premium Feature</CardTitle>
        </div>
        <p className="text-slate-400 text-sm">
          This feature requires {tierInfo.name} subscription
        </p>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Badge className={`${tierInfo.color} text-white`}>
            {tierInfo.icon}
            <span className="ml-1">{tierInfo.name}</span>
          </Badge>
        </div>
        
        <p className="text-slate-300 text-sm">
          {tierInfo.description}
        </p>
        
        <div className="space-y-2">
          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href="/pricing">
              Upgrade to {tierInfo.name}
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700/50">
            <Link href="/features">
              View All Features
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


