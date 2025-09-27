import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * API Cache Configuration
 * 
 * Defines caching strategies for different types of API responses.
 * Ensures stable responses are cached while dynamic data is fresh.
 */

export interface CacheConfig {
  tags: string[];
  revalidate: number; // seconds
  swr?: boolean; // stale-while-revalidate
}

/**
 * Cache configurations for different data types
 */
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // User profile data - stable, cache for 5 minutes
  user_profile: {
    tags: ['user', 'profile'],
    revalidate: 300,
    swr: true
  },
  
  // Subscription data - stable, cache for 1 minute
  subscription: {
    tags: ['user', 'subscription'],
    revalidate: 60,
    swr: true
  },
  
  // KPI data - calculated, cache for 5 minutes
  kpi: {
    tags: ['user', 'kpi'],
    revalidate: 300,
    swr: true
  },
  
  // Trades data - dynamic, cache for 1 minute
  trades: {
    tags: ['user', 'trades'],
    revalidate: 60,
    swr: true
  },
  
  // Instruments data - stable, cache for 1 hour
  instruments: {
    tags: ['instruments'],
    revalidate: 3600,
    swr: true
  },
  
  // Market data - dynamic, cache for 30 seconds
  market_data: {
    tags: ['market'],
    revalidate: 30,
    swr: true
  },
  
  // Static content - very stable, cache for 1 day
  static_content: {
    tags: ['static'],
    revalidate: 86400,
    swr: true
  }
};

/**
 * Create a cached API function
 */
export function createCachedApi<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  cacheKey: string,
  config: CacheConfig
) {
  return unstable_cache(fn, [cacheKey], {
    tags: config.tags,
    revalidate: config.revalidate,
    swr: config.swr
  });
}

/**
 * Cache key generators for different data types
 */
export const cacheKeys = {
  userProfile: (userId: string) => `user-profile-${userId}`,
  subscription: (userId: string) => `subscription-${userId}`,
  kpi: (userId: string, period?: string) => `kpi-${userId}-${period || 'all'}`,
  trades: (userId: string, filters?: string) => `trades-${userId}-${filters || 'all'}`,
  instruments: (symbol?: string) => `instruments-${symbol || 'all'}`,
  marketData: (symbol: string) => `market-${symbol}`,
  staticContent: (path: string) => `static-${path}`
};

/**
 * Invalidate cache by tags
 */
export function invalidateCache(tags: string[]) {
  tags.forEach(tag => revalidateTag(tag));
}

/**
 * Invalidate user-specific cache
 */
export function invalidateUserCache(userId: string) {
  invalidateCache(['user', 'profile', 'subscription', 'kpi', 'trades']);
}

/**
 * Invalidate specific data type cache
 */
export function invalidateDataCache(dataType: string) {
  const config = CACHE_CONFIGS[dataType];
  if (config) {
    invalidateCache(config.tags);
  }
}

/**
 * Cache-aware fetch wrapper
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheConfig?: CacheConfig
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Cache middleware for API routes
 */
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  cacheKey: string,
  config: CacheConfig
) {
  const cachedFn = createCachedApi(fn, cacheKey, config);
  
  return async (...args: T): Promise<R> => {
    try {
      return await cachedFn(...args);
    } catch (error) {
      console.error(`Cache error for ${cacheKey}:`, error);
      // Fallback to uncached function
      return fn(...args);
    }
  };
}

/**
 * Cache invalidation strategies
 */
export const invalidationStrategies = {
  // Invalidate on data change
  onDataChange: (dataType: string) => {
    invalidateDataCache(dataType);
  },
  
  // Invalidate on user action
  onUserAction: (userId: string, action: string) => {
    switch (action) {
      case 'trade_created':
      case 'trade_updated':
      case 'trade_deleted':
        invalidateCache(['trades', 'kpi']);
        break;
      case 'subscription_changed':
        invalidateCache(['subscription', 'kpi']);
        break;
      case 'profile_updated':
        invalidateCache(['user', 'profile']);
        break;
      default:
        invalidateUserCache(userId);
    }
  },
  
  // Invalidate on time-based schedule
  onSchedule: (dataType: string, interval: number) => {
    setInterval(() => {
      invalidateDataCache(dataType);
    }, interval);
  }
};

/**
 * Cache performance monitoring
 */
export class CacheMonitor {
  private static instance: CacheMonitor;
  private metrics: Map<string, { hits: number; misses: number; errors: number }> = new Map();

  static getInstance(): CacheMonitor {
    if (!CacheMonitor.instance) {
      CacheMonitor.instance = new CacheMonitor();
    }
    return CacheMonitor.instance;
  }

  recordHit(cacheKey: string) {
    const metrics = this.metrics.get(cacheKey) || { hits: 0, misses: 0, errors: 0 };
    metrics.hits++;
    this.metrics.set(cacheKey, metrics);
  }

  recordMiss(cacheKey: string) {
    const metrics = this.metrics.get(cacheKey) || { hits: 0, misses: 0, errors: 0 };
    metrics.misses++;
    this.metrics.set(cacheKey, metrics);
  }

  recordError(cacheKey: string) {
    const metrics = this.metrics.get(cacheKey) || { hits: 0, misses: 0, errors: 0 };
    metrics.errors++;
    this.metrics.set(cacheKey, metrics);
  }

  getMetrics(cacheKey?: string) {
    if (cacheKey) {
      return this.metrics.get(cacheKey);
    }
    return Object.fromEntries(this.metrics);
  }

  getHitRate(cacheKey: string): number {
    const metrics = this.metrics.get(cacheKey);
    if (!metrics) return 0;
    const total = metrics.hits + metrics.misses;
    return total > 0 ? metrics.hits / total : 0;
  }
}

/**
 * Cache debugging utilities
 */
export const cacheDebug = {
  logCacheHit: (cacheKey: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Cache hit: ${cacheKey}`);
    }
  },
  
  logCacheMiss: (cacheKey: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Cache miss: ${cacheKey}`);
    }
  },
  
  logCacheError: (cacheKey: string, error: Error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Cache error: ${cacheKey}`, error);
    }
  }
};
