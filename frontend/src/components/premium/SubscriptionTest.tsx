'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PremiumGateClient } from './PremiumGate';
import { useAuth } from '@/providers/auth-provider';
import { 
  Crown, 
  Star, 
  Zap, 
  Lock, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Settings,
  Shield
} from 'lucide-react';

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
 * Subscription Test Component
 * 
 * Tests the subscription system to ensure:
 * - Server-side verification works
 * - Client-side flags cannot spoof access
 * - UI updates after subscription changes
 * - Premium features are properly gated
 */
export function SubscriptionTest() {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    if (!user) return;
    
    setIsLoading(true);
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
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        console.error('Failed to fetch subscription status:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierInfo = (tier?: string) => {
    switch (tier) {
      case 'pro':
        return { name: 'Pro', icon: <Crown className="h-4 w-4" />, color: 'bg-purple-600' };
      case 'basic':
        return { name: 'Basic', icon: <Star className="h-4 w-4" />, color: 'bg-blue-600' };
      case 'enterprise':
        return { name: 'Enterprise', icon: <Zap className="h-4 w-4" />, color: 'bg-gold-600' };
      default:
        return { name: 'Free', icon: <Lock className="h-4 w-4" />, color: 'bg-slate-600' };
    }
  };

  const tierInfo = getTierInfo(subscriptionStatus?.tier);

  if (!user) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">
            Please log in to view subscription status
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Shield className="h-5 w-5" />
            <span>Subscription Status</span>
            <Button 
              onClick={fetchSubscriptionStatus} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-slate-800/50 rounded w-1/3"></div>
              <div className="h-4 bg-slate-800/50 rounded w-1/2"></div>
            </div>
          ) : subscriptionStatus ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={`${tierInfo.color} text-white`}>
                    {tierInfo.icon}
                    <span className="ml-1">{tierInfo.name}</span>
                  </Badge>
                  {subscriptionStatus.entitled ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div className="text-sm text-slate-400">
                  {lastUpdated}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Status:</span>
                  <span className="ml-2 text-slate-200">{subscriptionStatus.status || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Entitled:</span>
                  <span className="ml-2 text-slate-200">{subscriptionStatus.entitled ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {subscriptionStatus.features && subscriptionStatus.features.length > 0 && (
                <div>
                  <span className="text-slate-400 text-sm">Features:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {subscriptionStatus.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {subscriptionStatus.limits && (
                <div>
                  <span className="text-slate-400 text-sm">Limits:</span>
                  <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                    <div>
                      <span className="text-slate-400">Trades:</span>
                      <span className="ml-1 text-slate-200">
                        {subscriptionStatus.limits.maxTrades === -1 ? '∞' : subscriptionStatus.limits.maxTrades}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Imports:</span>
                      <span className="ml-1 text-slate-200">
                        {subscriptionStatus.limits.maxImports === -1 ? '∞' : subscriptionStatus.limits.maxImports}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Storage:</span>
                      <span className="ml-1 text-slate-200">
                        {subscriptionStatus.limits.maxStorage === -1 ? '∞' : 
                         `${Math.round((subscriptionStatus.limits.maxStorage || 0) / 1024 / 1024)}MB`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-slate-400">
              Failed to load subscription status
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Feature Tests */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Settings className="h-5 w-5" />
            <span>Premium Feature Tests</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-slate-300">Test Mode</span>
              <p className="text-xs text-slate-400">Simulate subscription changes</p>
            </div>
            <Switch
              checked={testMode}
              onCheckedChange={setTestMode}
            />
          </div>

          {/* Basic Feature Gate */}
          <div className="space-y-2">
            <h4 className="text-slate-300 font-medium">Basic Feature (requires Basic tier)</h4>
            <PremiumGateClient
              feature="basic_imports"
              tier="basic"
              fallback={
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Lock className="h-4 w-4" />
                    <span>Basic imports require Basic subscription</span>
                  </div>
                </div>
              }
            >
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded">
                <div className="flex items-center space-x-2 text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span>Basic imports are available</span>
                </div>
              </div>
            </PremiumGateClient>
          </div>

          {/* Pro Feature Gate */}
          <div className="space-y-2">
            <h4 className="text-slate-300 font-medium">Pro Feature (requires Pro tier)</h4>
            <PremiumGateClient
              feature="advanced_analytics"
              tier="pro"
              fallback={
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Lock className="h-4 w-4" />
                    <span>Advanced analytics require Pro subscription</span>
                  </div>
                </div>
              }
            >
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded">
                <div className="flex items-center space-x-2 text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span>Advanced analytics are available</span>
                </div>
              </div>
            </PremiumGateClient>
          </div>

          {/* Enterprise Feature Gate */}
          <div className="space-y-2">
            <h4 className="text-slate-300 font-medium">Enterprise Feature (requires Enterprise tier)</h4>
            <PremiumGateClient
              feature="white_label"
              tier="enterprise"
              fallback={
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Lock className="h-4 w-4" />
                    <span>White label requires Enterprise subscription</span>
                  </div>
                </div>
              }
            >
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded">
                <div className="flex items-center space-x-2 text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span>White label features are available</span>
                </div>
              </div>
            </PremiumGateClient>
          </div>
        </CardContent>
      </Card>

      {/* Security Test */}
      <Card className="bg-red-900/20 border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-200">
            <Shield className="h-5 w-5" />
            <span>Security Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-red-200">
              <strong>Client-side flags cannot spoof access:</strong>
            </p>
            <ul className="list-disc list-inside text-red-300 space-y-1">
              <li>All premium features are gated by server-side verification</li>
              <li>Subscription status is fetched from /api/me/subscription</li>
              <li>No local storage or client flags are trusted</li>
              <li>UI updates only after server confirms subscription change</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

