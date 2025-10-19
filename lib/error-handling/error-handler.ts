/**
 * Centralized error handling and logging system
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  AppError, 
  BaseAppError, 
  ErrorCode, 
  ErrorSeverity, 
  ErrorContext,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ExternalServiceError,
  RateLimitError,
  DatabaseError,
  InternalServerError,
  SecurityError
} from './error-types';
import { logAuditEvent, AuditAction } from '@/lib/security/audit';
import winston from 'winston';

// Enhanced logger configuration
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
      });
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // In production, you would add file transports
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCounts: Map<ErrorCode, number> = new Map();
  private alertThresholds: Map<ErrorSeverity, number> = new Map([
    [ErrorSeverity.LOW, 100],
    [ErrorSeverity.MEDIUM, 50],
    [ErrorSeverity.HIGH, 20],
    [ErrorSeverity.CRITICAL, 5],
  ]);

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log errors with appropriate responses
   */
  public async handleError(
    error: Error | AppError,
    request?: NextRequest,
    context?: ErrorContext
  ): Promise<NextResponse> {
    const appError = this.normalizeError(error, context);
    
    // Log the error
    await this.logError(appError, request);
    
    // Track error metrics
    this.trackError(appError);
    
    // Check for alerting
    await this.checkForAlerts(appError);
    
    // Return appropriate response
    return this.createErrorResponse(appError);
  }

  /**
   * Normalize any error to AppError format
   */
  private normalizeError(error: Error | AppError, context?: ErrorContext): AppError {
    if (error instanceof BaseAppError) {
      return error;
    }

    // Handle different types of errors
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, context);
    }
    
    if (error.name === 'UnauthorizedError') {
      return new AuthenticationError(error.message, context);
    }
    
    if (error.name === 'ForbiddenError') {
      return new AuthorizationError(error.message, context);
    }
    
    if (error.name === 'NotFoundError') {
      return new NotFoundError(error.message, context);
    }
    
    if (error.name === 'RateLimitError') {
      return new RateLimitError(error.message, context);
    }

    // Default to internal server error
    return new InternalServerError(
      process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      context
    );
  }

  /**
   * Log error with appropriate level and context
   */
  private async logError(error: AppError, request?: NextRequest): Promise<void> {
    const logData = {
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        stack: error.stack,
        context: error.context,
        userId: error.userId,
        requestId: error.requestId,
        timestamp: error.timestamp,
      },
      request: request ? {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        ip: request.ip,
        userAgent: request.headers.get('user-agent'),
      } : undefined,
    };

    // Log based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('CRITICAL ERROR', logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('HIGH SEVERITY ERROR', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('MEDIUM SEVERITY ERROR', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('LOW SEVERITY ERROR', logData);
        break;
    }

    // Log to audit system for security-related errors
    if (error.code.includes('AUTH_') || error.code.includes('SECURITY_')) {
      await logAuditEvent(
        AuditAction.SUSPICIOUS_ACTIVITY,
        request || new NextRequest('http://localhost'),
        {
          ...(error.userId && { userId: error.userId }),
          error: error.message,
          metadata: {
            errorCode: error.code,
            severity: error.severity,
            context: error.context,
          },
        }
      );
    }
  }

  /**
   * Track error metrics for monitoring
   */
  private trackError(error: AppError): void {
    const currentCount = this.errorCounts.get(error.code) || 0;
    this.errorCounts.set(error.code, currentCount + 1);
  }

  /**
   * Check if error thresholds are exceeded and trigger alerts
   */
  private async checkForAlerts(error: AppError): Promise<void> {
    const threshold = this.alertThresholds.get(error.severity);
    if (!threshold) return;

    const errorCount = this.errorCounts.get(error.code) || 0;
    
    if (errorCount >= threshold) {
      await this.triggerAlert(error, errorCount);
    }
  }

  /**
   * Trigger alert for critical errors
   */
  private async triggerAlert(error: AppError, count: number): Promise<void> {
    logger.error('ALERT TRIGGERED', {
      errorCode: error.code,
      severity: error.severity,
      count,
      threshold: this.alertThresholds.get(error.severity),
      message: `Error ${error.code} has occurred ${count} times`,
    });

    // In production, you would integrate with alerting systems like:
    // - Slack notifications
    // - Email alerts
    // - PagerDuty
    // - Sentry
    // - DataDog
  }

  /**
   * Create appropriate HTTP response for error
   */
  public createErrorResponse(error: AppError): NextResponse {
    const responseData = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          context: error.context,
        }),
      },
      timestamp: error.timestamp.toISOString(),
      requestId: error.requestId,
    };

    return NextResponse.json(responseData, {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Code': error.code,
        'X-Error-Severity': error.severity,
        ...(error.requestId && { 'X-Request-ID': error.requestId }),
      },
    });
  }

  /**
   * Get error statistics for monitoring
   */
  public getErrorStats(): Record<string, any> {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0),
      errorCounts: Object.fromEntries(this.errorCounts),
      thresholds: Object.fromEntries(this.alertThresholds),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset error counters (useful for testing or periodic resets)
   */
  public resetErrorCounters(): void {
    this.errorCounts.clear();
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

/**
 * Express-style error handling middleware for Next.js API routes
 */
export function withErrorHandling(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      const errorContext: ErrorContext = {
        requestId: req.headers.get('x-request-id') || undefined,
        endpoint: req.url,
        method: req.method,
        userAgent: req.headers.get('user-agent') || undefined,
        ip: req.ip || undefined,
        ...context,
      };

      return await errorHandler.handleError(error as Error, req, errorContext);
    }
  };
}

/**
 * Utility function to create standardized error responses
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number = 500,
  context?: ErrorContext
): NextResponse {
  // Create the appropriate error type based on the code
  let error: BaseAppError;
  
  if (code.includes('AUTH_')) {
    error = new AuthenticationError(message, context);
  } else if (code.includes('VALIDATION_')) {
    error = new ValidationError(message, context);
  } else if (code.includes('DB_')) {
    error = new DatabaseError(message, context);
  } else if (code.includes('API_')) {
    error = new ExternalServiceError('API', message, context);
  } else {
    error = new InternalServerError(message, context);
  }
  
  return errorHandler.createErrorResponse(error);
}

/**
 * Async error wrapper for cleaner error handling
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw error;
    }
  };
}
