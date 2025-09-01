'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { getUserSubscription, upgradeToPro, cancelSubscription, formatTrialDays, getSubscriptionFeatures, UserRole } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Crown, Clock, Check, AlertTriangle, CreditCard } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  async function loadSubscription() {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getUserSubscription(user.id);
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    if (!user) return;
    
    try {
      setUpgrading(true);
      const result = await upgradeToPro(user.id);
      
      if (result.success) {
        toast.success('Successfully upgraded to Pro!');
        loadSubscription(); // Reload data
      } else {
        toast.error(result.error || 'Failed to upgrade');
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      toast.error('Failed to upgrade subscription');
    } finally {
      setUpgrading(false);
    }
  }

  async function handleCancel() {
    if (!user) return;
    
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your current billing period.')) {
      return;
    }
    
    try {
      setCancelling(true);
      const result = await cancelSubscription(user.id);
      
      if (result.success) {
        toast.success('Subscription cancelled successfully');
        loadSubscription(); // Reload data
      } else {
        toast.error(result.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--pp-accent]"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-[--pp-muted]">Manage your subscription and billing</p>
        </div>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load subscription data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isTrialActive = subscription.subscription_status === 'trial' && 
    subscription.trial_ends_at && 
    new Date(subscription.trial_ends_at) > new Date();
  
  const isProActive = subscription.role === 'pro' && 
    subscription.subscription_status === 'active';
  
  const isExpired = !isTrialActive && !isProActive;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-[--pp-muted]">Manage your subscription and billing</p>
      </div>

      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {subscription.role === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </h3>
              <p className="text-[--pp-muted]">
                ${subscription.role === 'pro' ? '20' : '0'}/month
              </p>
            </div>
            <Badge 
              variant={
                isProActive ? 'default' : 
                isTrialActive ? 'secondary' : 
                'destructive'
              }
            >
              {isProActive ? 'Active' : 
               isTrialActive ? 'Trial' : 
               'Expired'}
            </Badge>
          </div>

          {isTrialActive && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>{formatTrialDays(Math.ceil((new Date(subscription.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} left</strong> in your free trial
              </AlertDescription>
            </Alert>
          )}

          {isExpired && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your trial has expired. Upgrade to Pro to continue using all features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <Card className={subscription.role === 'free' && !isExpired ? 'ring-2 ring-[--pp-accent]' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Free Plan
              <span className="text-2xl font-bold">$0</span>
            </CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {getSubscriptionFeatures('free').map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[--pp-accent]" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            {subscription.role === 'free' && !isExpired && (
              <Badge variant="secondary" className="w-full justify-center">
                Current Plan
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={subscription.role === 'pro' ? 'ring-2 ring-[--pp-accent]' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                Pro Plan
                <Crown className="w-4 h-4 text-[--pp-accent]" />
              </div>
              <span className="text-2xl font-bold">$20</span>
            </CardTitle>
            <CardDescription>For serious traders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {getSubscriptionFeatures('pro').map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[--pp-accent]" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            {subscription.role === 'pro' ? (
              <div className="space-y-2">
                <Badge variant="default" className="w-full justify-center">
                  Current Plan
                </Badge>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full"
                onClick={handleUpgrade}
                disabled={upgrading}
              >
                {upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing Information */}
      {isProActive && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>Your payment and billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[--pp-muted]">Next billing date:</span>
                <span className="text-sm font-medium">
                  {subscription.subscription_ends_at 
                    ? new Date(subscription.subscription_ends_at).toLocaleDateString()
                    : 'Ongoing'
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-[--pp-muted]">Payment method:</span>
                <span className="text-sm font-medium">Credit card ending in ****</span>
              </div>
              
              <Separator />
              
              <p className="text-xs text-[--pp-muted]">
                You can cancel your subscription at any time. You'll continue to have access to Pro features until the end of your current billing period.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
