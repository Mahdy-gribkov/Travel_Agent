/**
 * High-performance caching system with multiple strategies
 */

import { NextRequest, NextResponse } from 'next/server';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum number of items
  strategy?: 'lru' | 'fifo' | 'ttl';
  tags?: string[]; // For cache invalidation
}

export interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  accessCount: number;
  lastAccessed: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private caches: Map<string, Map<string, CacheItem<any>>> = new Map();
  private options: Map<string, CacheOptions> = new Map();
  private stats: Map<string, { hits: number; misses: number; evictions: number }> = new Map();

  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Check if a cache exists
   */
  public hasCache(name: string): boolean {
    return this.caches.has(name);
  }

  /**
   * Get a cache by name
   */
  public getCache(name: string): Map<string, CacheItem<any>> | undefined {
    return this.caches.get(name);
  }

  /**
   * Get all cache names
   */
  public getCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }

  /**
   * Create a new cache with options
   */
  public createCache(name: string, options: CacheOptions = {}): void {
    this.caches.set(name, new Map());
    this.options.set(name, {
      ttl: 300, // 5 minutes default
      maxSize: 1000, // 1000 items default
      strategy: 'lru',
      ...options,
    });
    this.stats.set(name, { hits: 0, misses: 0, evictions: 0 });
  }

  /**
   * Get value from cache
   */
  public get<T>(cacheName: string, key: string): T | null {
    const cache = this.caches.get(cacheName);
    const options = this.options.get(cacheName);
    const stats = this.stats.get(cacheName);

    if (!cache || !options || !stats) {
      return null;
    }

    const item = cache.get(key);
    if (!item) {
      stats.misses++;
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl * 1000) {
      cache.delete(key);
      stats.misses++;
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();
    stats.hits++;

    return item.value;
  }

  /**
   * Set value in cache
   */
  public set<T>(cacheName: string, key: string, value: T, customTtl?: number): void {
    const cache = this.caches.get(cacheName);
    const options = this.options.get(cacheName);

    if (!cache || !options) {
      return;
    }

    // Check if cache is full and evict if necessary
    if (cache.size >= options.maxSize!) {
      this.evict(cacheName);
    }

    const ttl = customTtl || options.ttl!;
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      tags: options.tags || [],
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    cache.set(key, item);
  }

  /**
   * Delete value from cache
   */
  public delete(cacheName: string, key: string): boolean {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      return false;
    }
    return cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  public clear(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.clear();
    }
  }

  /**
   * Invalidate cache by tags
   */
  public invalidateByTags(cacheName: string, tags: string[]): number {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      return 0;
    }

    let invalidated = 0;
    for (const [key, item] of cache.entries()) {
      if (tags.some(tag => item.tags.includes(tag))) {
        cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Get cache statistics
   */
  public getStats(cacheName: string): any {
    const cache = this.caches.get(cacheName);
    const stats = this.stats.get(cacheName);
    
    if (!cache || !stats) {
      return null;
    }

    const total = stats.hits + stats.misses;
    const hitRate = total > 0 ? (stats.hits / total) * 100 : 0;

    return {
      size: cache.size,
      hits: stats.hits,
      misses: stats.misses,
      evictions: stats.evictions,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Evict items based on strategy
   */
  private evict(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    const options = this.options.get(cacheName);
    const stats = this.stats.get(cacheName);

    if (!cache || !options || !stats) {
      return;
    }

    const items = Array.from(cache.entries());
    let itemToEvict: [string, CacheItem<any>] | null = null;

    switch (options.strategy) {
      case 'lru':
        itemToEvict = items.reduce((oldest, current) => 
          current[1].lastAccessed < oldest[1].lastAccessed ? current : oldest
        );
        break;
      case 'fifo':
        itemToEvict = items.reduce((oldest, current) => 
          current[1].timestamp < oldest[1].timestamp ? current : oldest
        );
        break;
      case 'ttl':
        itemToEvict = items.reduce((oldest, current) => 
          current[1].timestamp < oldest[1].timestamp ? current : oldest
        );
        break;
    }

    if (itemToEvict) {
      cache.delete(itemToEvict[0]);
      stats.evictions++;
    }
  }

  /**
   * Cleanup expired items
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [cacheName, cache] of this.caches.entries()) {
      for (const [key, item] of cache.entries()) {
        if (now - item.timestamp > item.ttl * 1000) {
          cache.delete(key);
        }
      }
    }
  }
}

// Global cache manager instance
export const cacheManager = CacheManager.getInstance();

/**
 * Request-based caching middleware
 */
export function withCaching(
  cacheName: string,
  keyGenerator: (req: NextRequest) => string,
  options: CacheOptions = {}
) {
  return function(
    handler: (req: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, context?: any): Promise<NextResponse> => {
      // Create cache if it doesn't exist
      if (!cacheManager.hasCache(cacheName)) {
        cacheManager.createCache(cacheName, options);
      }

      const key = keyGenerator(req);
      const cached = cacheManager.get<NextResponse>(cacheName, key);

      if (cached) {
        // Return cached response with cache headers
        const response = new NextResponse(cached.body, {
          status: cached.status,
          headers: {
            ...cached.headers,
            'X-Cache': 'HIT',
            'X-Cache-Key': key,
          },
        });
        return response;
      }

      // Execute handler and cache response
      const response = await handler(req, context);
      
      // Clone response for caching
      const responseClone = response.clone();
      const responseData = {
        body: await responseClone.text(),
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };

      cacheManager.set(cacheName, key, responseData, options.ttl);

      // Add cache headers to response
      response.headers.set('X-Cache', 'MISS');
      response.headers.set('X-Cache-Key', key);

      return response;
    };
  };
}

/**
 * Function result caching decorator
 */
export function cached<T extends any[], R>(
  cacheName: string,
  keyGenerator: (...args: T) => string,
  options: CacheOptions = {}
) {
  return function(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function(...args: T): Promise<R> {
      // Create cache if it doesn't exist
      if (!cacheManager.hasCache(cacheName)) {
        cacheManager.createCache(cacheName, options);
      }

      const key = keyGenerator(...args);
      const cached = cacheManager.get<R>(cacheName, key);

      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      cacheManager.set(cacheName, key, result, options.ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidation utilities
 */
export class CacheInvalidator {
  /**
   * Invalidate cache by pattern
   */
  public static invalidateByPattern(cacheName: string, pattern: RegExp): number {
    const cache = cacheManager.getCache(cacheName);
    if (!cache) {
      return 0;
    }

    let invalidated = 0;
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Invalidate all caches
   */
  public static invalidateAll(): void {
    for (const cacheName of cacheManager.getCacheNames()) {
      cacheManager.clear(cacheName);
    }
  }

  /**
   * Invalidate user-specific caches
   */
  public static invalidateUserCaches(userId: string): number {
    let totalInvalidated = 0;
    
    for (const cacheName of cacheManager.getCacheNames()) {
      const invalidated = this.invalidateByPattern(cacheName, new RegExp(`user:${userId}`));
      totalInvalidated += invalidated;
    }

    return totalInvalidated;
  }
}
