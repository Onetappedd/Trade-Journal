'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { VirtualizedTradesTable } from '@/src/components/trades/VirtualizedTradesTable';
import { PerformanceMonitor } from '@/src/components/performance/PerformanceMonitor';
import { useApi } from '@/src/hooks/useApi';
import { 
  Activity, 
  Database, 
  Network, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Shield,
  BarChart3
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

/**
 * Performance Test Component
 * 
 * Tests performance optimizations for large accounts:
 * - Virtualized tables for large datasets
 * - Server-side filtering and sorting
 * - Intelligent caching strategies
 * - Performance monitoring
 * 
 * Features:
 * - Simulate large datasets
 * - Test virtualization performance
 * - Monitor cache effectiveness
 * - Measure render performance
 */
export function PerformanceTest() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [simulateLargeDataset, setSimulateLargeDataset] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    networkRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryUsage: 0,
    componentCount: 0,
    errorCount: 0
  });

  // API hooks for testing
  const tradesApi = useApi({
    onSuccess: (data) => {
      console.log('Trades loaded:', data);
    },
    onError: (error) => {
      console.error('Trades error:', error);
    }
  });

  const kpiApi = useApi({
    onSuccess: (data) => {
      console.log('KPI loaded:', data);
    },
    onError: (error) => {
      console.error('KPI error:', error);
    }
  });

  // Performance monitoring setup
  useEffect(() => {
    if (!isMonitoring) return;

    const startTime = performance.now();
    
    // Monitor render performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setPerformanceMetrics(prev => ({
            ...prev,
            renderTime: entry.duration
          }));
        }
      });
    });
    observer.observe({ entryTypes: ['measure'] });

    // Monitor network requests
    const originalFetch = window.fetch;
    let requestCount = 0;
    
    window.fetch = async (...args) => {
      requestCount++;
      setPerformanceMetrics(prev => ({
        ...prev,
        networkRequests: requestCount
      }));
      return originalFetch(...args);
    };

    // Monitor memory usage
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setPerformanceMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
        }));
      }
    };

    const memoryInterval = setInterval(checkMemory, 1000);

    // Monitor component count
    const countComponents = () => {
      const componentCount = document.querySelectorAll('[data-component]').length;
      setPerformanceMetrics(prev => ({
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
  }, [isMonitoring]);

  // Test API performance
  const testApiPerformance = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      // Test trades API
      await tradesApi.execute('/api/trades?limit=100');
      
      // Test KPI API
      await kpiApi.execute('/api/kpi/summary');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        renderTime: duration
      }));
      
      console.log(`API performance test completed in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('API performance test failed:', error);
    }
  }, [tradesApi, kpiApi]);

  // Test cache performance
  const testCachePerformance = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      // First request (cache miss)
      await tradesApi.execute('/api/trades?limit=50');
      
      // Second request (cache hit)
      await tradesApi.execute('/api/trades?limit=50');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        cacheHits: prev.cacheHits + 1,
        cacheMisses: prev.cacheMisses + 1
      }));
      
      console.log(`Cache performance test completed in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('Cache performance test failed:', error);
    }
  }, [tradesApi]);

  // Simulate large dataset
  const simulateLargeDataset = useCallback(() => {
    const startTime = performance.now();
    
    // Create a large array to simulate large dataset
    const largeArray = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      symbol: `SYMBOL${i}`,
      side: i % 2 === 0 ? 'BUY' : 'SELL',
      quantity: Math.floor(Math.random() * 1000),
      price: Math.random() * 100,
      pnl: Math.random() * 1000 - 500,
      opened_at: new Date().toISOString(),
      status: i % 3 === 0 ? 'open' : 'closed'
    }));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setPerformanceMetrics(prev => ({
      ...prev,
      renderTime: duration
    }));
    
    console.log(`Large dataset simulation completed in ${duration.toFixed(2)}ms`);
  }, []);

  const getPerformanceStatus = () => {
    if (performanceMetrics.renderTime > 100) return { status: 'poor', color: 'red', icon: AlertTriangle };
    if (performanceMetrics.renderTime > 50) return { status: 'fair', color: 'yellow', icon: AlertTriangle };
    return { status: 'good', color: 'green', icon: CheckCircle };
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <div className="space-y-6">
      {/* Performance Controls */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Activity className="h-5 w-5" />
            <span>Performance Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-300">Performance Monitoring</span>
                <p className="text-xs text-slate-400">Enable real-time performance tracking</p>
              </div>
              <Switch
                checked={isMonitoring}
                onCheckedChange={setIsMonitoring}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-300">Show Details</span>
                <p className="text-xs text-slate-400">Display detailed performance metrics</p>
              </div>
              <Switch
                checked={showDetails}
                onCheckedChange={setShowDetails}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={testApiPerformance}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Network className="h-4 w-4 mr-2" />
              Test API Performance
            </Button>
            
            <Button
              onClick={testCachePerformance}
              variant="outline"
              className="bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700/50"
            >
              <Database className="h-4 w-4 mr-2" />
              Test Cache Performance
            </Button>
            
            <Button
              onClick={simulateLargeDataset}
              variant="outline"
              className="bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700/50"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Simulate Large Dataset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Monitor */}
      {isMonitoring && (
        <PerformanceMonitor
          enabled={isMonitoring}
          showDetails={showDetails}
          onMetricsUpdate={setPerformanceMetrics}
        />
      )}

      {/* Performance Status */}
      <Card className={`${
        performanceStatus.status === 'good' ? 'bg-green-900/20 border-green-500/30' :
        performanceStatus.status === 'fair' ? 'bg-yellow-900/20 border-yellow-500/30' :
        'bg-red-900/20 border-red-500/30'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {performanceStatus.status === 'good' ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            )}
            <span className={
              performanceStatus.status === 'good' ? 'text-green-200' :
              performanceStatus.status === 'fair' ? 'text-yellow-200' :
              'text-red-200'
            }>
              Performance Status: {performanceStatus.status.toUpperCase()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Render Time:</span>
              <span className={`ml-2 ${
                performanceMetrics.renderTime > 100 ? 'text-red-400' : 
                performanceMetrics.renderTime > 50 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {performanceMetrics.renderTime.toFixed(1)}ms
              </span>
            </div>
            <div>
              <span className="text-slate-400">Network Requests:</span>
              <span className="ml-2 text-slate-200">{performanceMetrics.networkRequests}</span>
            </div>
            <div>
              <span className="text-slate-400">Memory Usage:</span>
              <span className="ml-2 text-slate-200">{performanceMetrics.memoryUsage.toFixed(1)}MB</span>
            </div>
            <div>
              <span className="text-slate-400">Components:</span>
              <span className="ml-2 text-slate-200">{performanceMetrics.componentCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Virtualized Trades Table */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Database className="h-5 w-5" />
            <span>Virtualized Trades Table</span>
            <Badge variant="outline" className="ml-auto">
              Optimized for Large Datasets
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              <p>This table uses virtualization to handle large datasets efficiently:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Only renders visible rows for optimal performance</li>
                <li>Server-side filtering and sorting to reduce payload</li>
                <li>Pagination to limit data transfer</li>
                <li>Cached responses for frequently accessed data</li>
              </ul>
            </div>
            
            <VirtualizedTradesTable
              showFilters={true}
              showPagination={true}
              pageSize={50}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Optimizations */}
      <Card className="bg-blue-900/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-200">
            <Zap className="h-5 w-5" />
            <span>Performance Optimizations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-blue-200 font-medium">Virtualization</h4>
              <ul className="list-disc list-inside text-blue-300 space-y-1 text-sm">
                <li>React-window for efficient rendering</li>
                <li>Only visible rows are rendered</li>
                <li>Reduces memory usage for large datasets</li>
                <li>Maintains smooth scrolling performance</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-blue-200 font-medium">Server-Side Processing</h4>
              <ul className="list-disc list-inside text-blue-300 space-y-1 text-sm">
                <li>Filtering and sorting on server</li>
                <li>Pagination to limit data transfer</li>
                <li>Minimal network payloads</li>
                <li>Reduced client-side processing</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-blue-200 font-medium">Caching Strategy</h4>
              <ul className="list-disc list-inside text-blue-300 space-y-1 text-sm">
                <li>Stable data cached for 5+ minutes</li>
                <li>Dynamic data cached for 1 minute</li>
                <li>Tag-based cache invalidation</li>
                <li>Stale-while-revalidate for performance</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-blue-200 font-medium">Monitoring</h4>
              <ul className="list-disc list-inside text-blue-300 space-y-1 text-sm">
                <li>Real-time performance tracking</li>
                <li>Render time monitoring</li>
                <li>Memory usage tracking</li>
                <li>Cache hit/miss ratios</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
