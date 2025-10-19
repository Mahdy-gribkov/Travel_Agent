/**
 * Comprehensive error handling system for the Travel Agent application
 */

export enum ErrorCode {
  // Authentication & Authorization
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
  
  // API Errors
  API_RATE_LIMIT_EXCEEDED = 'API_RATE_LIMIT_EXCEEDED',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  API_SERVICE_UNAVAILABLE = 'API_SERVICE_UNAVAILABLE',
  API_INVALID_REQUEST = 'API_INVALID_REQUEST',
  API_EXTERNAL_SERVICE_ERROR = 'API_EXTERNAL_SERVICE_ERROR',
  
  // Data Validation
  VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
  VALIDATION_MISSING_REQUIRED_FIELD = 'VALIDATION_MISSING_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  
  // Database Errors
  DB_CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED = 'DB_QUERY_FAILED',
  DB_TRANSACTION_FAILED = 'DB_TRANSACTION_FAILED',
  DB_CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',
  
  // Business Logic
  ITINERARY_NOT_FOUND = 'ITINERARY_NOT_FOUND',
  ITINERARY_ACCESS_DENIED = 'ITINERARY_ACCESS_DENIED',
  CHAT_SESSION_NOT_FOUND = 'CHAT_SESSION_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // External Services
  WEATHER_SERVICE_ERROR = 'WEATHER_SERVICE_ERROR',
  FLIGHT_SERVICE_ERROR = 'FLIGHT_SERVICE_ERROR',
  MAPS_SERVICE_ERROR = 'MAPS_SERVICE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  
  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Security
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AppError extends Error {
  code: ErrorCode;
  severity: ErrorSeverity;
  statusCode: number;
  isOperational: boolean;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  requestId?: string;
  stack?: string;
}


export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  body?: any;
  query?: any;
  params?: any;
}

export class BaseAppError extends Error implements AppError {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: ErrorCode,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: ErrorContext
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    if (context?.userId) this.userId = context.userId;
    if (context?.requestId) this.requestId = context.requestId;
    this.context = {
      endpoint: context?.endpoint,
      method: context?.method,
      userAgent: context?.userAgent,
      ip: context?.ip,
      body: context?.body,
      query: context?.query,
      params: context?.params,
    };

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class AuthenticationError extends BaseAppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.AUTH_INVALID_CREDENTIALS, ErrorSeverity.HIGH, 401, true, context);
  }
}

export class AuthorizationError extends BaseAppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, ErrorSeverity.HIGH, 403, true, context);
  }
}

export class ValidationError extends BaseAppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.VALIDATION_INVALID_INPUT, ErrorSeverity.MEDIUM, 400, true, context);
  }
}

export class NotFoundError extends BaseAppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.ITINERARY_NOT_FOUND, ErrorSeverity.MEDIUM, 404, true, context);
  }
}

export class ExternalServiceError extends BaseAppError {
  constructor(service: string, message: string, context?: ErrorContext) {
    super(
      `External service error (${service}): ${message}`,
      ErrorCode.API_EXTERNAL_SERVICE_ERROR,
      ErrorSeverity.HIGH,
      502,
      true,
      context
    );
  }
}

export class RateLimitError extends BaseAppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.API_RATE_LIMIT_EXCEEDED, ErrorSeverity.MEDIUM, 429, true, context);
  }
}

export class DatabaseError extends BaseAppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.DB_QUERY_FAILED, ErrorSeverity.HIGH, 500, true, context);
  }
}

export class InternalServerError extends BaseAppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.INTERNAL_SERVER_ERROR, ErrorSeverity.CRITICAL, 500, false, context);
  }
}

export class SecurityError extends BaseAppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.SECURITY_VIOLATION, ErrorSeverity.CRITICAL, 403, true, context);
  }
}
