interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
}

class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    return undefined
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// IV calculation cache
const ivCache = new LRUCache<string, number>(200)

export function getIVCacheKey(inputs: {
  S: number
  K: number
  T: number
  r: number
  q: number
  type: 'call' | 'put'
  targetPrice: number
}): string {
  return `${inputs.S.toFixed(4)}_${inputs.K.toFixed(4)}_${inputs.T.toFixed(6)}_${inputs.r.toFixed(4)}_${inputs.q.toFixed(4)}_${inputs.type}_${inputs.targetPrice.toFixed(6)}`
}

export function getCachedIV(key: string): number | undefined {
  return ivCache.get(key)
}

export function setCachedIV(key: string, iv: number): void {
  ivCache.set(key, iv)
}

// Pricing cache for slider scrubbing
const pricingCache = new LRUCache<string, {
  price: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
}>(500)

export function getPricingCacheKey(inputs: {
  S: number
  K: number
  T: number
  iv: number
  r: number
  q: number
  type: 'call' | 'put'
  method: string
}): string {
  return `${inputs.S.toFixed(4)}_${inputs.K.toFixed(4)}_${inputs.T.toFixed(6)}_${inputs.iv.toFixed(6)}_${inputs.r.toFixed(4)}_${inputs.q.toFixed(4)}_${inputs.type}_${inputs.method}`
}

export function getCachedPricing(key: string) {
  return pricingCache.get(key)
}

export function setCachedPricing(key: string, results: {
  price: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
}): void {
  pricingCache.set(key, results)
}

// Clear caches periodically to prevent memory leaks
setInterval(() => {
  if (ivCache.size() > 150) {
    ivCache.clear()
  }
  if (pricingCache.size() > 400) {
    pricingCache.clear()
  }
}, 5 * 60 * 1000) // Every 5 minutes

export { ivCache, pricingCache }
