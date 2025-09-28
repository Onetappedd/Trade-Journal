'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Clock, 
  Database, 
  Network, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface PerformanceMetrics {
  renderTime: number;
  networkRequests: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsage: number;
  componentCount: number;
  errorCount: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showDetails?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

/**
 * Performance Monitor Component
 * 
 * Monitors and displays performance metrics for large accounts.
 * Helps identify performance bottlenecks and optimization opportunities.
 * 
 * Features:
 * - Real-time performance monitoring
 * - Render time tracking
 * - Network request monitoring
 * - Cache hit/miss ratios
 * - Memory usage tracking
 * - Error rate monitoring
 */
export function PerformanceMonitor({ 
  enabled = false, 
  showDetails = false,
  onMetricsUpdate 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    networkRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryUsage: 0,
    componentCount: 0,
    errorCount: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  // Performance monitoring setup
  useEffect(() => {
    if (!enabled) return;

    setIsMonitoring(true);
    
    // Monitor render performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration
          }));
        }
      });
    });
    observer.observe({ entryTypes: ['measure'] });

    // Monitor network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const response = await originalFetch(...args);
      const end = performance.now();
      
      setMetrics(prev => ({
        ...prev,
        networkRequests: prev.networkRequests + 1
      }));
      
      return response;
    };

    // Monitor memory usage
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
        }));
      }
    };

    const memoryInterval = setInterval(checkMemory, 1000);

    // Monitor component count
    const countComponents = () => {
      const componentCount = document.querySelectorAll('[data-component]').length;
      setMetrics(prev => ({
        ...prev,
        componentCount
      }));
    };

    const componentInterval = setInterval(countComponents, 2000);

    return () => {
      observer.disconnect();
      window.fetch = originalFetch;
      clearInterval(memoryInterval);
      clearInterval(componentInterval);
    };
  }, [enabled]);

  // Update metrics callback
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  // Performance data collection
  const collectPerformanceData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: { ...metrics },
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink
      } : null
    };

    setPerformanceData(prev => [...prev.slice(-9), data]); // Keep last 10 entries
  }, [metrics]);

  // Auto-collect performance data
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(collectPerformanceData, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [enabled, collectPerformanceData]);

  const getPerformanceStatus = () => {
    if (metrics.renderTime > 100) return { status: 'poor', color: 'red', icon: AlertTriangle };
    if (metrics.renderTime > 50) return { status: 'fair', color: 'yellow', icon: AlertTriangle };
    return { status: 'good', color: 'green', icon: CheckCircle };
  };

  const getCacheHitRate = () => {
    const total = metrics.cacheHits + metrics.cacheMisses;
    return total > 0 ? (metrics.cacheHits / total) * 100 : 0;
  };

  const performanceStatus = getPerformanceStatus();
  const cacheHitRate = getCacheHitRate();

  if (!enabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Performance Overview */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Activity className="h-5 w-5" />
            <span>Performance Monitor</span>
            <Badge 
              variant={performanceStatus.status === 'good' ? 'default' : 'destructive'}
              className="ml-auto"
            >
              {performanceStatus.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-4 w-4 text-slate-400 mr-1" />
                <span className="text-sm text-slate-400">Render Time</span>
              </div>
              <div className={`text-lg font-bold ${
                metrics.renderTime > 100 ? 'text-red-400' : 
                metrics.renderTime > 50 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {metrics.renderTime.toFixed(1)}ms
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Network className="h-4 w-4 text-slate-400 mr-1" />
                <span className="text-sm text-slate-400">Requests</span>
              </div>
              <div className="text-lg font-bold text-slate-200">
                {metrics.networkRequests}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-4 w-4 text-slate-400 mr-1" />
                <span className="text-sm text-slate-400">Cache Hit Rate</span>
              </div>
              <div className={`text-lg font-bold ${
                cacheHitRate > 80 ? 'text-green-400' : 
                cacheHitRate > 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {cacheHitRate.toFixed(1)}%
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-4 w-4 text-slate-400 mr-1" />
                <span className="text-sm text-slate-400">Memory</span>
              </div>
              <div className="text-lg font-bold text-slate-200">
                {metrics.memoryUsage.toFixed(1)}MB
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          {showDetails && (
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">Detailed Metrics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Components:</span>
                  <span className="ml-2 text-slate-200">{metrics.componentCount}</span>
                </div>
                <div>
                  <span className="text-slate-400">Cache Hits:</span>
                  <span className="ml-2 text-slate-200">{metrics.cacheHits}</span>
                </div>
                <div>
                  <span className="text-slate-400">Cache Misses:</span>
                  <span className="ml-2 text-slate-200">{metrics.cacheMisses}</span>
                </div>
                <div>
                  <span className="text-slate-400">Errors:</span>
                  <span className="ml-2 text-slate-200">{metrics.errorCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Performance Data History */}
          {performanceData.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-slate-300 font-medium">Performance History</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {performanceData.slice(-5).map((data, index) => (
                  <div key={index} className="text-xs text-slate-400 bg-slate-800/30 p-2 rounded">
                    <div className="flex justify-between">
                      <span>{new Date(data.timestamp).toLocaleTimeString()}</span>
                      <span>{data.metrics.renderTime.toFixed(1)}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              onClick={collectPerformanceData}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Collect Data
            </Button>
            <Button
              onClick={() => setPerformanceData([])}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700/50"
            >
              Clear History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card className="bg-blue-900/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-200">
            <TrendingUp className="h-5 w-5" />
            <span>Performance Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {metrics.renderTime > 100 && (
              <div className="text-blue-300">
                • Consider using virtualization for large lists
              </div>
            )}
            {cacheHitRate < 60 && (
              <div className="text-blue-300">
                • Increase cache duration for stable data
              </div>
            )}
            {metrics.memoryUsage > 100 && (
              <div className="text-blue-300">
                • Consider lazy loading for heavy components
              </div>
            )}
            {metrics.networkRequests > 20 && (
              <div className="text-blue-300">
                • Batch API requests to reduce network overhead
              </div>
            )}
            {metrics.componentCount > 1000 && (
              <div className="text-blue-300">
                • Use React.memo for expensive components
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

