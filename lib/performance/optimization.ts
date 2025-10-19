/**
 * Performance optimization utilities and middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector, recordCustomMetric } from '@/lib/monitoring/metrics';

export interface PerformanceConfig {
  enableCompression?: boolean;
  enableCaching?: boolean;
  maxRequestSize?: number;
  timeout?: number;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private config: PerformanceConfig;

  private constructor() {
    this.config = {
      enableCompression: true,
      enableCaching: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      timeout: 30000, // 30 seconds
    };
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Configure performance settings
   */
  public configure(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Optimize response with compression and headers
   */
  public optimizeResponse(response: NextResponse, request: NextRequest): NextResponse {
    // Add performance headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Add caching headers for static content
    if (this.isStaticContent(request)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (this.isCacheable(request)) {
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    } else {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    // Add compression headers
    if (this.config.enableCompression && this.shouldCompress(request, response)) {
      response.headers.set('Content-Encoding', 'gzip');
    }

    return response;
  }

  /**
   * Check if content is static
   */
  private isStaticContent(request: NextRequest): boolean {
    const pathname = request.nextUrl.pathname;
    return pathname.startsWith('/_next/static/') || 
           pathname.startsWith('/static/') ||
           /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/.test(pathname);
  }

  /**
   * Check if content is cacheable
   */
  private isCacheable(request: NextRequest): boolean {
    const pathname = request.nextUrl.pathname;
    const method = request.method;
    
    // Only cache GET requests
    if (method !== 'GET') {
      return false;
    }

    // Don't cache API routes that require authentication
    if (pathname.startsWith('/api/') && this.requiresAuth(pathname)) {
      return false;
    }

    // Cache public API routes
    if (pathname.startsWith('/api/health') || 
        pathname.startsWith('/api/metrics') ||
        pathname.startsWith('/api/weather') ||
        pathname.startsWith('/api/countries')) {
      return true;
    }

    return false;
  }

  /**
   * Check if API route requires authentication
   */
  private requiresAuth(pathname: string): boolean {
    const protectedRoutes = [
      '/api/chat',
      '/api/itineraries',
      '/api/users',
      '/api/admin',
    ];
    
    return protectedRoutes.some(route => pathname.startsWith(route));
  }

  /**
   * Check if response should be compressed
   */
  private shouldCompress(request: NextRequest, response: NextResponse): boolean {
    const acceptEncoding = request.headers.get('accept-encoding') || '';
    const contentType = response.headers.get('content-type') || '';
    
    // Check if client supports compression
    if (!acceptEncoding.includes('gzip')) {
      return false;
    }

    // Check if content type is compressible
    const compressibleTypes = [
      'application/json',
      'application/javascript',
      'text/css',
      'text/html',
      'text/plain',
      'text/xml',
    ];

    return compressibleTypes.some(type => contentType.includes(type));
  }

  /**
   * Validate request size
   */
  public validateRequestSize(request: NextRequest): boolean {
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      return size <= this.config.maxRequestSize!;
    }
    return true;
  }

  /**
   * Add performance monitoring to response
   */
  public addPerformanceHeaders(response: NextResponse, startTime: number): NextResponse {
    const responseTime = Date.now() - startTime;
    
    response.headers.set('X-Response-Time', `${responseTime}ms`);
    response.headers.set('X-Process-Time', `${process.uptime()}s`);
    
    // Record performance metrics
    recordCustomMetric('response_time', responseTime, {
      endpoint: response.headers.get('x-endpoint') || 'unknown',
    });

    return response;
  }
}

// Global performance optimizer instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

/**
 * Performance optimization middleware
 */
export function withPerformanceOptimization(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    
    // Validate request size
    if (!performanceOptimizer.validateRequestSize(req)) {
      return NextResponse.json(
        { success: false, error: 'Request too large' },
        { status: 413 }
      );
    }

    try {
      // Execute handler
      const response = await handler(req, context);
      
      // Optimize response
      const optimizedResponse = performanceOptimizer.optimizeResponse(response, req);
      
      // Add performance headers
      const finalResponse = performanceOptimizer.addPerformanceHeaders(optimizedResponse, startTime);
      
      return finalResponse;
    } catch (error) {
      // Record error metrics
      recordCustomMetric('error_count', 1, {
        endpoint: req.nextUrl.pathname,
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
      });
      
      throw error;
    }
  };
}

/**
 * Database query optimization utilities
 */
export class QueryOptimizer {
  /**
   * Optimize database queries with pagination
   */
  public static paginate(page: number = 1, limit: number = 20): { offset: number; limit: number } {
    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    
    return {
      offset: (normalizedPage - 1) * normalizedLimit,
      limit: normalizedLimit,
    };
  }

  /**
   * Optimize sort parameters
   */
  public static optimizeSort(sortBy?: string, sortOrder?: string): { field: string; order: 'asc' | 'desc' } {
    const allowedFields = ['createdAt', 'updatedAt', 'title', 'destination', 'status'];
    const field = allowedFields.includes(sortBy || '') ? sortBy! : 'createdAt';
    const order = sortOrder === 'desc' ? 'desc' : 'asc';
    
    return { field, order };
  }

  /**
   * Optimize filter parameters
   */
  public static optimizeFilters(filters: Record<string, any>): Record<string, any> {
    const optimized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        // Sanitize string values
        if (typeof value === 'string') {
          optimized[key] = value.trim().substring(0, 100); // Limit string length
        } else {
          optimized[key] = value;
        }
      }
    }
    
    return optimized;
  }
}

/**
 * Memory optimization utilities
 */
export class MemoryOptimizer {
  /**
   * Force garbage collection (if available)
   */
  public static forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get memory usage statistics
   */
  public static getMemoryStats(): Record<string, number> {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }

  /**
   * Check if memory usage is high
   */
  public static isMemoryHigh(threshold: number = 80): boolean {
    const usage = process.memoryUsage();
    const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;
    return usagePercent > threshold;
  }
}

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  /**
   * Generate optimized image URLs
   */
  public static optimizeImageUrl(url: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}): string {
    const { width, height, quality = 80, format = 'webp' } = options;
    
    // In a real application, you would use a service like Cloudinary or ImageKit
    // For now, we'll return the original URL with query parameters
    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality) params.set('q', quality.toString());
    if (format) params.set('f', format);
    
    return `${url}?${params.toString()}`;
  }

  /**
   * Generate responsive image srcset
   */
  public static generateSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes
      .map(size => `${this.optimizeImageUrl(baseUrl, { width: size })} ${size}w`)
      .join(', ');
  }
}
