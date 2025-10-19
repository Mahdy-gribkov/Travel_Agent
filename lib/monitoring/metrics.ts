/**
 * Application metrics and monitoring system
 */

import { NextRequest, NextResponse } from 'next/server';

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage?: number;
  requestSize: number;
  responseSize: number;
  timestamp: Date;
}

export interface BusinessMetrics {
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
  conversionRate?: number;
  revenue?: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, MetricData[]> = new Map();
  private performanceData: Map<string, PerformanceMetrics[]> = new Map();
  private businessData: Map<string, BusinessMetrics[]> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Record a custom metric
   */
  public recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>,
    metadata?: Record<string, any>
  ): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: new Date(),
      ...(tags && { tags }),
      ...(metadata && { metadata }),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(metric);
    
    // Keep only last 1000 metrics per name to prevent memory leaks
    const metrics = this.metrics.get(name)!;
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
  }

  /**
   * Record performance metrics for a request
   */
  public recordPerformance(
    endpoint: string,
    metrics: Omit<PerformanceMetrics, 'timestamp'>
  ): void {
    if (!this.performanceData.has(endpoint)) {
      this.performanceData.set(endpoint, []);
    }
    
    const performanceData: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date(),
    };
    
    this.performanceData.get(endpoint)!.push(performanceData);
    
    // Keep only last 100 performance records per endpoint
    const perfData = this.performanceData.get(endpoint)!;
    if (perfData.length > 100) {
      perfData.splice(0, perfData.length - 100);
    }
  }

  /**
   * Record business metrics
   */
  public recordBusinessMetrics(metrics: BusinessMetrics): void {
    const timestamp = new Date().toISOString();
    if (!this.businessData.has(timestamp)) {
      this.businessData.set(timestamp, []);
    }
    
    this.businessData.get(timestamp)!.push(metrics);
  }

  /**
   * Increment request counter
   */
  public incrementRequest(endpoint: string): void {
    const current = this.requestCounts.get(endpoint) || 0;
    this.requestCounts.set(endpoint, current + 1);
  }

  /**
   * Increment error counter
   */
  public incrementError(endpoint: string, errorType?: string): void {
    const key = errorType ? `${endpoint}:${errorType}` : endpoint;
    const current = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, current + 1);
  }

  /**
   * Get metrics for a specific name
   */
  public getMetrics(name: string): MetricData[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get performance data for an endpoint
   */
  public getPerformanceData(endpoint: string): PerformanceMetrics[] {
    return this.performanceData.get(endpoint) || [];
  }

  /**
   * Get aggregated metrics
   */
  public getAggregatedMetrics(): Record<string, any> {
    const aggregated: Record<string, any> = {};
    
    // Aggregate custom metrics
    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length > 0) {
        const values = metrics.map(m => m.value);
        aggregated[name] = {
          count: metrics.length,
          sum: values.reduce((a, b) => a + b, 0),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          latest: metrics[metrics.length - 1]?.value || 0,
        };
      }
    }
    
    // Aggregate performance data
    for (const [endpoint, perfData] of this.performanceData.entries()) {
      if (perfData.length > 0) {
        const responseTimes = perfData.map(p => p.responseTime);
        aggregated[`performance.${endpoint}`] = {
          count: perfData.length,
          avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
          minResponseTime: Math.min(...responseTimes),
          maxResponseTime: Math.max(...responseTimes),
          avgMemoryUsage: perfData.reduce((a, b) => a + b.memoryUsage, 0) / perfData.length,
        };
      }
    }
    
    // Request and error counts
    aggregated.requests = Object.fromEntries(this.requestCounts);
    aggregated.errors = Object.fromEntries(this.errorCounts);
    
    return aggregated;
  }

  /**
   * Get health check data
   */
  public getHealthData(): Record<string, any> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Calculate error rate in the last hour
    const recentErrors = Array.from(this.errorCounts.values())
      .reduce((a, b) => a + b, 0);
    const recentRequests = Array.from(this.requestCounts.values())
      .reduce((a, b) => a + b, 0);
    
    const errorRate = recentRequests > 0 ? (recentErrors / recentRequests) * 100 : 0;
    
    // Calculate average response time
    let avgResponseTime = 0;
    let totalPerfRecords = 0;
    
    for (const perfData of this.performanceData.values()) {
      if (perfData.length > 0) {
        avgResponseTime += perfData.reduce((a, b) => a + b.responseTime, 0);
        totalPerfRecords += perfData.length;
      }
    }
    
    if (totalPerfRecords > 0) {
      avgResponseTime /= totalPerfRecords;
    }
    
    return {
      status: errorRate > 10 ? 'unhealthy' : errorRate > 5 ? 'degraded' : 'healthy',
      timestamp: now.toISOString(),
      metrics: {
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        totalRequests: recentRequests,
        totalErrors: recentErrors,
      },
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  public cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Clean up old metrics
    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > oneHourAgo);
      this.metrics.set(name, filtered);
    }
    
    // Clean up old performance data
    for (const [endpoint, perfData] of this.performanceData.entries()) {
      const filtered = perfData.filter(p => p.timestamp > oneHourAgo);
      this.performanceData.set(endpoint, filtered);
    }
  }
}

// Global metrics collector instance
export const metricsCollector = MetricsCollector.getInstance();

/**
 * Middleware to collect request metrics
 */
export function withMetrics(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const endpoint = req.nextUrl.pathname;
    
    try {
      // Increment request counter
      metricsCollector.incrementRequest(endpoint);
      
      // Execute handler
      const response = await handler(req, context);
      
      // Calculate performance metrics
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const responseTime = endTime - startTime;
      
      const performanceMetrics = {
        responseTime,
        memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
        requestSize: parseInt(req.headers.get('content-length') || '0'),
        responseSize: parseInt(response.headers.get('content-length') || '0'),
      };
      
      // Record performance metrics
      metricsCollector.recordPerformance(endpoint, performanceMetrics);
      
      // Record custom metrics
      metricsCollector.recordMetric('response_time', responseTime, {
        endpoint,
        method: req.method,
        status: response.status.toString(),
      });
      
      metricsCollector.recordMetric('memory_usage', performanceMetrics.memoryUsage, {
        endpoint,
      });
      
      return response;
    } catch (error) {
      // Increment error counter
      const errorName = error instanceof Error ? error.constructor.name : 'UnknownError';
      metricsCollector.incrementError(endpoint, errorName);
      
      // Record error metrics
      metricsCollector.recordMetric('error_count', 1, {
        endpoint,
        error_type: errorName,
      });
      
      throw error;
    }
  };
}

/**
 * Utility to record business metrics
 */
export function recordBusinessMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
): void {
  metricsCollector.recordMetric(`business.${name}`, value, tags);
}

/**
 * Utility to record custom application metrics
 */
export function recordCustomMetric(
  name: string,
  value: number,
  tags?: Record<string, string>,
  metadata?: Record<string, any>
): void {
  metricsCollector.recordMetric(name, value, tags, metadata);
}
