'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { checkUserAccess, UserRole, SubscriptionCheck } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Crown, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function SubscriptionGuard({ 
  children, 
  requiredRole = 'free',
  fallback,
  showUpgradePrompt = true 
}: SubscriptionGuardProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionCheck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const access = await checkUserAccess(user.id, requiredRole);
        setSubscription(access);
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [user, requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--pp-accent]"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access this feature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscription?.hasAccess) {
    if (showUpgradePrompt) {
      return <UpgradePrompt subscription={subscription} requiredRole={requiredRole} />;
    }
    return fallback || null;
  }

  return <>{children}</>;
}

function UpgradePrompt({ 
  subscription, 
  requiredRole 
}: { 
  subscription: SubscriptionCheck | null; 
  requiredRole: UserRole;
}) {
  if (!subscription) return null;

  const isTrialExpired = subscription.isExpired && !subscription.isSubscriptionActive;
  const isProFeature = requiredRole === 'pro';

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isTrialExpired ? (
            <>
              <div className="mx-auto mb-4 w-12 h-12 bg-[--pp-danger]/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[--pp-danger]" />
              </div>
              <CardTitle>Trial Expired</CardTitle>
              <CardDescription>
                Your 7-day free trial has ended. Upgrade to Pro to continue using all features.
              </CardDescription>
            </>
          ) : isProFeature ? (
            <>
              <div className="mx-auto mb-4 w-12 h-12 bg-[--pp-accent]/10 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-[--pp-accent]" />
              </div>
              <CardTitle>Pro Feature</CardTitle>
              <CardDescription>
                This feature is only available to Pro subscribers.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 w-12 h-12 bg-[--pp-accent]/10 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-[--pp-accent]" />
              </div>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>
                You don't have access to this feature with your current subscription.
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {subscription.isTrialActive && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>{subscription.daysLeftInTrial} days left</strong> in your free trial
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[--pp-muted]">Current Plan:</span>
              <Badge variant={subscription.role === 'pro' ? 'default' : 'secondary'}>
                {subscription.role === 'pro' ? 'Pro' : 'Free'}
              </Badge>
            </div>
            
            {subscription.isTrialActive && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[--pp-muted]">Trial Ends:</span>
                <span className="text-sm font-medium">
                  {subscription.trialEndsAt?.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Link href="/dashboard/billing">
              <Button className="w-full">
                {isTrialExpired ? 'Upgrade to Pro' : 'View Plans'}
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
