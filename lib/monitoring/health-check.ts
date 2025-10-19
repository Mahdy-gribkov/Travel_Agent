/**
 * Health check and system monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from './metrics';
import { errorHandler } from '@/lib/error-handling';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheckItem;
    externalServices: HealthCheckItem;
    memory: HealthCheckItem;
    disk: HealthCheckItem;
    api: HealthCheckItem;
  };
  metrics: {
    errorRate: number;
    avgResponseTime: number;
    totalRequests: number;
    totalErrors: number;
  };
}

export interface HealthCheckItem {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export class HealthChecker {
  private static instance: HealthChecker;
  private lastCheck: Date = new Date();
  private checkInterval: number = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  /**
   * Perform comprehensive health check
   */
  public async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    // Run all health checks in parallel
    const [
      databaseCheck,
      externalServicesCheck,
      memoryCheck,
      diskCheck,
      apiCheck,
    ] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkExternalServices(),
      this.checkMemory(),
      this.checkDisk(),
      this.checkApi(),
    ]);

    const checks = {
      database: this.getCheckResult(databaseCheck),
      externalServices: this.getCheckResult(externalServicesCheck),
      memory: this.getCheckResult(memoryCheck),
      disk: this.getCheckResult(diskCheck),
      api: this.getCheckResult(apiCheck),
    };

    // Determine overall status
    const hasFailures = Object.values(checks).some(check => check.status === 'fail');
    const hasWarnings = Object.values(checks).some(check => check.status === 'warn');
    
    const status = hasFailures ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';

    // Get metrics data
    const healthData = metricsCollector.getHealthData();

    const result: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      metrics: healthData.metrics,
    };

    this.lastCheck = new Date();
    return result;
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<HealthCheckItem> {
    const startTime = Date.now();
    
    try {
      // In a real application, you would check actual database connectivity
      // For now, we'll simulate a check
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'pass',
        message: 'Database connection healthy',
        responseTime,
        details: {
          connectionPool: 'active',
          queriesPerSecond: 0, // Would be calculated from actual metrics
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'fail',
        message: `Database connection failed: ${errorMessage}`,
        responseTime: Date.now() - startTime,
        details: {
          error: errorMessage,
        },
      };
    }
  }

  /**
   * Check external services
   */
  private async checkExternalServices(): Promise<HealthCheckItem> {
    const startTime = Date.now();
    const services = [
      { name: 'OpenWeatherMap', url: 'https://api.openweathermap.org' },
      { name: 'Amadeus', url: 'https://test.api.amadeus.com' },
      { name: 'Google Maps', url: 'https://maps.googleapis.com' },
      { name: 'REST Countries', url: 'https://restcountries.com' },
    ];

    const results = await Promise.allSettled(
      services.map(async (service) => {
        try {
          // In a real application, you would make actual HTTP requests
          // For now, we'll simulate the check
          await new Promise(resolve => setTimeout(resolve, 50));
          return { name: service.name, status: 'healthy' };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { name: service.name, status: 'unhealthy', error: errorMessage };
        }
      })
    );

    const healthyServices = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 'healthy'
    ).length;

    const responseTime = Date.now() - startTime;
    const status = healthyServices === services.length ? 'pass' : 
                  healthyServices > services.length / 2 ? 'warn' : 'fail';

    return {
      status,
      message: `${healthyServices}/${services.length} external services healthy`,
      responseTime,
      details: {
        services: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error' }),
      },
    };
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheckItem> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    let status: 'pass' | 'warn' | 'fail';
    let message: string;

    if (memoryUsagePercent > 90) {
      status = 'fail';
      message = 'Memory usage critically high';
    } else if (memoryUsagePercent > 80) {
      status = 'warn';
      message = 'Memory usage high';
    } else {
      status = 'pass';
      message = 'Memory usage normal';
    }

    return {
      status,
      message,
      details: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(memoryUsagePercent * 100) / 100,
      },
    };
  }

  /**
   * Check disk space (simplified)
   */
  private async checkDisk(): Promise<HealthCheckItem> {
    // In a real application, you would check actual disk space
    // For now, we'll simulate a check
    const diskUsagePercent = Math.random() * 100; // Simulated

    let status: 'pass' | 'warn' | 'fail';
    let message: string;

    if (diskUsagePercent > 95) {
      status = 'fail';
      message = 'Disk space critically low';
    } else if (diskUsagePercent > 85) {
      status = 'warn';
      message = 'Disk space low';
    } else {
      status = 'pass';
      message = 'Disk space normal';
    }

    return {
      status,
      message,
      details: {
        usagePercent: Math.round(diskUsagePercent * 100) / 100,
      },
    };
  }

  /**
   * Check API performance
   */
  private async checkApi(): Promise<HealthCheckItem> {
    const healthData = metricsCollector.getHealthData();
    const errorRate = healthData.metrics.errorRate;
    const avgResponseTime = healthData.metrics.avgResponseTime;

    let status: 'pass' | 'warn' | 'fail';
    let message: string;

    if (errorRate > 10 || avgResponseTime > 5000) {
      status = 'fail';
      message = 'API performance degraded';
    } else if (errorRate > 5 || avgResponseTime > 2000) {
      status = 'warn';
      message = 'API performance suboptimal';
    } else {
      status = 'pass';
      message = 'API performance normal';
    }

    return {
      status,
      message,
      details: {
        errorRate,
        avgResponseTime,
        totalRequests: healthData.metrics.totalRequests,
      },
    };
  }

  /**
   * Get check result from Promise.allSettled result
   */
  private getCheckResult(result: PromiseSettledResult<HealthCheckItem>): HealthCheckItem {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'fail',
        message: `Health check failed: ${result.reason}`,
        details: {
          error: result.reason,
        },
      };
    }
  }

  /**
   * Get last check time
   */
  public getLastCheckTime(): Date {
    return this.lastCheck;
  }

  /**
   * Check if health check is due
   */
  public isCheckDue(): boolean {
    return Date.now() - this.lastCheck.getTime() > this.checkInterval;
  }
}

// Global health checker instance
export const healthChecker = HealthChecker.getInstance();

/**
 * Health check API endpoint handler
 */
export async function handleHealthCheck(req: NextRequest): Promise<NextResponse> {
  try {
    const healthResult = await healthChecker.performHealthCheck();
    
    const statusCode = healthResult.status === 'healthy' ? 200 : 
                      healthResult.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthResult, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * Readiness check (simpler than health check)
 */
export async function handleReadinessCheck(req: NextRequest): Promise<NextResponse> {
  try {
    // Basic readiness checks
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    const isReady = memoryUsagePercent < 95; // Simple memory check
    
    if (isReady) {
      return NextResponse.json(
        { status: 'ready', timestamp: new Date().toISOString() },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { status: 'not ready', reason: 'High memory usage' },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { status: 'not ready', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    );
  }
}

/**
 * Liveness check (simplest check)
 */
export async function handleLivenessCheck(req: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { status: 'alive', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
