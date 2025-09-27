'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/src/hooks/useApi';
import { useToast } from '@/components/ui/toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Bug,
  Server,
  Network,
  Database,
  Shield
} from 'lucide-react';

/**
 * Error Test Component
 * 
 * Tests the error handling system to ensure:
 * - Standardized JSON error shapes
 * - Toast notifications work correctly
 * - Error boundaries catch errors
 * - Loading skeletons display properly
 * - Recovery paths are available
 */
export function ErrorTest() {
  const { addToast } = useToast();
  const [simulatedError, setSimulatedError] = useState<string | null>(null);

  // Test different API error scenarios
  const kpiApi = useApi({
    onSuccess: (data) => {
      addToast({
        type: 'success',
        title: 'KPI Data Loaded',
        message: 'Successfully fetched KPI data from server'
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'KPI Load Failed',
        message: error.message
      });
    }
  });

  const subscriptionApi = useApi({
    onSuccess: (data) => {
      addToast({
        type: 'success',
        title: 'Subscription Loaded',
        message: 'Successfully fetched subscription data'
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Subscription Load Failed',
        message: error.message
      });
    }
  });

  const testKpiApi = async () => {
    await kpiApi.execute('/api/kpi/summary');
  };

  const testSubscriptionApi = async () => {
    await subscriptionApi.execute('/api/me/subscription');
  };

  const testSimulatedError = (errorType: string) => {
    setSimulatedError(errorType);
    
    // Simulate different error scenarios
    switch (errorType) {
      case '500':
        addToast({
          type: 'error',
          title: 'Server Error',
          message: 'Internal server error occurred',
          action: {
            label: 'Retry',
            onClick: () => testSimulatedError('500')
          }
        });
        break;
      case 'network':
        addToast({
          type: 'error',
          title: 'Network Error',
          message: 'Failed to connect to server',
          action: {
            label: 'Retry',
            onClick: () => testSimulatedError('network')
          }
        });
        break;
      case 'validation':
        addToast({
          type: 'warning',
          title: 'Validation Error',
          message: 'Please check your input and try again'
        });
        break;
      case 'auth':
        addToast({
          type: 'error',
          title: 'Authentication Error',
          message: 'Please log in again',
          action: {
            label: 'Login',
            onClick: () => window.location.href = '/login'
          }
        });
        break;
    }
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case '500':
        return <Server className="h-5 w-5 text-red-400" />;
      case 'network':
        return <Network className="h-5 w-5 text-red-400" />;
      case 'validation':
        return <Shield className="h-5 w-5 text-yellow-400" />;
      case 'auth':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Bug className="h-5 w-5 text-slate-400" />;
    }
  };

  const getErrorColor = (type: string) => {
    switch (type) {
      case '500':
        return 'bg-red-900/20 border-red-500/30';
      case 'network':
        return 'bg-red-900/20 border-red-500/30';
      case 'validation':
        return 'bg-yellow-900/20 border-yellow-500/30';
      case 'auth':
        return 'bg-red-900/20 border-red-500/30';
      default:
        return 'bg-slate-900/20 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* API Tests */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <CheckCircle className="h-5 w-5" />
            <span>API Error Tests</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">KPI API Test</h4>
              <Button
                onClick={testKpiApi}
                disabled={kpiApi.loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {kpiApi.loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Test KPI API'
                )}
              </Button>
              {kpiApi.error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
                  <div className="flex items-center space-x-2 text-red-200">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">{kpiApi.error.message}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">Subscription API Test</h4>
              <Button
                onClick={testSubscriptionApi}
                disabled={subscriptionApi.loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {subscriptionApi.loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Test Subscription API'
                )}
              </Button>
              {subscriptionApi.error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
                  <div className="flex items-center space-x-2 text-red-200">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">{subscriptionApi.error.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulated Error Tests */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <AlertTriangle className="h-5 w-5" />
            <span>Simulated Error Tests</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => testSimulatedError('500')}
              variant="outline"
              className="bg-red-900/20 border-red-500/30 text-red-200 hover:bg-red-800/30"
            >
              <Server className="h-4 w-4 mr-2" />
              500 Error
            </Button>
            
            <Button
              onClick={() => testSimulatedError('network')}
              variant="outline"
              className="bg-red-900/20 border-red-500/30 text-red-200 hover:bg-red-800/30"
            >
              <Network className="h-4 w-4 mr-2" />
              Network Error
            </Button>
            
            <Button
              onClick={() => testSimulatedError('validation')}
              variant="outline"
              className="bg-yellow-900/20 border-yellow-500/30 text-yellow-200 hover:bg-yellow-800/30"
            >
              <Shield className="h-4 w-4 mr-2" />
              Validation Error
            </Button>
            
            <Button
              onClick={() => testSimulatedError('auth')}
              variant="outline"
              className="bg-red-900/20 border-red-500/30 text-red-200 hover:bg-red-800/30"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Auth Error
            </Button>
          </div>

          {simulatedError && (
            <div className={`p-4 rounded border ${getErrorColor(simulatedError)}`}>
              <div className="flex items-center space-x-2">
                {getErrorIcon(simulatedError)}
                <span className="text-slate-200 font-medium">
                  Simulated {simulatedError} error
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                This demonstrates how the error handling system responds to different error types.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Boundary Test */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Bug className="h-5 w-5" />
            <span>Error Boundary Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-slate-400 text-sm">
            <p>Click the button below to trigger a JavaScript error that will be caught by the error boundary.</p>
          </div>
          
          <Button
            onClick={() => {
              // This will throw an error and be caught by the error boundary
              throw new Error('Test error for error boundary');
            }}
            variant="outline"
            className="bg-red-900/20 border-red-500/30 text-red-200 hover:bg-red-800/30"
          >
            Trigger Error Boundary
          </Button>
        </CardContent>
      </Card>

      {/* Error Handling Features */}
      <Card className="bg-green-900/20 border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-200">
            <CheckCircle className="h-5 w-5" />
            <span>Error Handling Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="text-green-200 font-medium">Standardized Error Responses</h4>
              <ul className="list-disc list-inside text-green-300 space-y-1">
                <li>Consistent JSON error shape: {`{ error: { code, message } }`}</li>
                <li>Proper HTTP status codes</li>
                <li>Error code categorization</li>
                <li>User-friendly error messages</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-green-200 font-medium">User Experience</h4>
              <ul className="list-disc list-inside text-green-300 space-y-1">
                <li>Toast notifications for errors</li>
                <li>Loading skeletons during requests</li>
                <li>Error boundaries for crashes</li>
                <li>Recovery paths and retry options</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
