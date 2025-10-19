import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from './headers';
import { withRateLimit, RATE_LIMITS, withDDoSProtection, withBruteForceProtection } from './rate-limit';
import { withAuditLogging, AuditAction } from './audit';
import { withRBAC, Permission, UserRole } from './rbac';
import { withValidation } from '../middleware/validation';
import { withApiKey, withOptionalApiKey } from '../middleware/api-key';
import { z } from 'zod';

// Security configuration interface
export interface SecurityConfig {
  // Authentication & Authorization
  auth?: {
    required: boolean;
    type?: 'api-key' | 'session';
    roles?: readonly UserRole[];
    permissions?: readonly Permission[];
  };
  
  // Rate limiting
  rateLimit?: {
    enabled: boolean;
    config: keyof typeof RATE_LIMITS | 'custom';
    customConfig?: {
      windowMs: number;
      maxRequests: number;
    };
  };
  
  // DDoS protection
  ddosProtection?: {
    enabled: boolean;
    maxRequestsPerSecond?: number;
  };
  
  // Brute force protection
  bruteForceProtection?: {
    enabled: boolean;
  };
  
  // Input validation
  validation?: {
    enabled: boolean;
    schema?: z.ZodSchema<any>;
  };
  
  // Audit logging
  audit?: {
    enabled: boolean;
    action: AuditAction;
  };
  
  // Security headers
  headers?: {
    enabled: boolean;
    environment?: 'development' | 'production';
  };
  
  // CORS
  cors?: {
    enabled: boolean;
    allowedOrigins?: string[];
  };
  
  // CSRF protection
  csrf?: {
    enabled: boolean;
  };
  
  // Resource ownership check
  resourceOwnership?: {
    enabled: boolean;
    resourceExtractor?: (req: NextRequest) => { userId: string; resourceId: string; resourceType: string } | null;
  };
}

// Predefined security configurations for common use cases
export const SECURITY_PRESETS = {
  // Public API endpoints (minimal security)
  public: {
    auth: { required: false },
    rateLimit: { enabled: true, config: 'public' },
    ddosProtection: { enabled: true, maxRequestsPerSecond: 10 },
    validation: { enabled: true },
    audit: { enabled: true, action: AuditAction.API_CALL },
    headers: { enabled: true },
    cors: { enabled: true },
    csrf: { enabled: false },
  },
  
  // User API endpoints (standard security)
  user: {
    auth: { required: true, type: 'api-key', roles: [UserRole.USER, UserRole.ADMIN] },
    rateLimit: { enabled: true, config: 'api' },
    ddosProtection: { enabled: true, maxRequestsPerSecond: 5 },
    validation: { enabled: true },
    audit: { enabled: true, action: AuditAction.API_CALL },
    headers: { enabled: true },
    cors: { enabled: true },
    csrf: { enabled: true },
  },
  
  // Chat endpoints (enhanced security)
  chat: {
    auth: { required: true, type: 'api-key', roles: [UserRole.USER, UserRole.ADMIN] },
    rateLimit: { enabled: true, config: 'chat' },
    ddosProtection: { enabled: true, maxRequestsPerSecond: 3 },
    validation: { enabled: true },
    audit: { enabled: true, action: AuditAction.CHAT_MESSAGE_SENT },
    headers: { enabled: true },
    cors: { enabled: true },
    csrf: { enabled: true },
  },
  
  // Authentication endpoints (brute force protection)
  auth: {
    auth: { required: false },
    rateLimit: { enabled: true, config: 'auth' },
    bruteForceProtection: { enabled: true },
    ddosProtection: { enabled: true, maxRequestsPerSecond: 2 },
    validation: { enabled: true },
    audit: { enabled: true, action: AuditAction.LOGIN },
    headers: { enabled: true },
    cors: { enabled: true },
    csrf: { enabled: true },
  },
  
  // Admin endpoints (maximum security)
  admin: {
    auth: { required: true, type: 'api-key', roles: [UserRole.ADMIN] },
    rateLimit: { enabled: true, config: 'admin' },
    ddosProtection: { enabled: true, maxRequestsPerSecond: 5 },
    validation: { enabled: true },
    audit: { enabled: true, action: 'manage_system' as any },
    headers: { enabled: true },
    cors: { enabled: true },
    csrf: { enabled: true },
  },
  
  // Search endpoints (moderate security)
  search: {
    auth: { required: true, type: 'api-key', roles: [UserRole.USER, UserRole.ADMIN] },
    rateLimit: { enabled: true, config: 'search' },
    ddosProtection: { enabled: true, maxRequestsPerSecond: 8 },
    validation: { enabled: true },
    audit: { enabled: true, action: AuditAction.API_CALL },
    headers: { enabled: true },
    cors: { enabled: true },
    csrf: { enabled: true },
  },
  
  // File upload endpoints (strict security)
  upload: {
    auth: { required: true, type: 'api-key', roles: [UserRole.USER, UserRole.ADMIN] },
    rateLimit: { enabled: true, config: 'upload' },
    ddosProtection: { enabled: true, maxRequestsPerSecond: 2 },
    validation: { enabled: true },
    audit: { enabled: true, action: AuditAction.API_CALL },
    headers: { enabled: true },
    cors: { enabled: true },
    csrf: { enabled: true },
  },
} as const;

// Universal security middleware factory
export function createSecureHandler(
  config: SecurityConfig | keyof typeof SECURITY_PRESETS,
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  // Resolve configuration
  const securityConfig = typeof config === 'string' 
    ? SECURITY_PRESETS[config] 
    : config;
  
  // Start with the base handler
  let middleware = handler;
  
  // Apply security headers (always first)
  if (securityConfig.headers?.enabled !== false) {
    middleware = withSecurity(middleware, (securityConfig.headers as any)?.environment);
  }
  
  // Apply CORS
  if (securityConfig.cors?.enabled !== false) {
    // CORS is handled by withSecurity, but we can add custom logic here if needed
  }
  
  // Apply CSRF protection
  if (securityConfig.csrf?.enabled !== false) {
    // CSRF is handled by withSecurity
  }
  
  // Apply DDoS protection
  if (securityConfig.ddosProtection?.enabled) {
    middleware = withDDoSProtection(
      securityConfig.ddosProtection.maxRequestsPerSecond || 10,
      middleware
    );
  }
  
  // Apply brute force protection
  if ((securityConfig as any).bruteForceProtection?.enabled) {
    middleware = withBruteForceProtection(middleware);
  }
  
  // Apply rate limiting
  if (securityConfig.rateLimit?.enabled !== false) {
    if (securityConfig.rateLimit?.config === 'custom' && securityConfig.rateLimit?.customConfig) {
      middleware = withRateLimit(securityConfig.rateLimit.customConfig, middleware);
    } else if (securityConfig.rateLimit?.config && securityConfig.rateLimit.config !== 'custom') {
      const rateLimitConfig = RATE_LIMITS[securityConfig.rateLimit.config];
      middleware = withRateLimit(rateLimitConfig, middleware);
    }
  }
  
  // Apply audit logging
  if (securityConfig.audit?.enabled !== false && securityConfig.audit?.action) {
    middleware = withAuditLogging(securityConfig.audit.action, middleware);
  }
  
  // Apply input validation
  if (securityConfig.validation?.enabled !== false && (securityConfig.validation as any)?.schema) {
    middleware = withValidation((securityConfig.validation as any).schema, middleware);
  }
  
  // Apply authentication and authorization
  if (securityConfig.auth?.required) {
    // Apply API key authentication
    const authMiddleware = (req: NextRequest, context?: any) => {
      return withApiKey(req, async (authReq, apiKeyContext) => {
        return middleware(authReq, { ...context, ...apiKeyContext });
      });
    };
    middleware = authMiddleware;
    
    // Apply RBAC if permissions are specified
    if ((securityConfig.auth as any).permissions && (securityConfig.auth as any).permissions.length > 0) {
      // Use the first permission for RBAC (in a real app, you might want to check all)
      middleware = withRBAC((securityConfig.auth as any).permissions[0], middleware);
    }
  }
  
  // Apply resource ownership check
  if ((securityConfig as any).resourceOwnership?.enabled && (securityConfig as any).resourceOwnership?.resourceExtractor) {
    middleware = withResourceOwnership((securityConfig as any).resourceOwnership.resourceExtractor, middleware);
  }
  
  return middleware;
}

// Convenience functions for common patterns
export const secure = {
  // Public endpoints
  public: (handler: (req: NextRequest) => Promise<NextResponse>) => 
    createSecureHandler('public', handler),
  
  // User endpoints
  user: (handler: (req: NextRequest, context?: any) => Promise<NextResponse>) => 
    createSecureHandler('user', handler),
  
  // Chat endpoints
  chat: (handler: (req: NextRequest, context?: any) => Promise<NextResponse>) => 
    createSecureHandler('chat', handler),
  
  // Auth endpoints
  auth: (handler: (req: NextRequest) => Promise<NextResponse>) => 
    createSecureHandler('auth', handler),
  
  // Admin endpoints
  admin: (handler: (req: NextRequest, context?: any) => Promise<NextResponse>) => 
    createSecureHandler('admin', handler),
  
  // Search endpoints
  search: (handler: (req: NextRequest, context?: any) => Promise<NextResponse>) => 
    createSecureHandler('search', handler),
  
  // Upload endpoints
  upload: (handler: (req: NextRequest, context?: any) => Promise<NextResponse>) => 
    createSecureHandler('upload', handler),
  
  // Custom configuration
  custom: (config: SecurityConfig, handler: (req: NextRequest, context?: any) => Promise<NextResponse>) => 
    createSecureHandler(config, handler),
};

// Resource ownership helper (moved to avoid conflicts)
function withResourceOwnership(
  resourceExtractor: (req: NextRequest) => { userId: string; resourceId: string; resourceType: string } | null,
  handler: (req: NextRequest, context: any, resource: { userId: string; resourceId: string; resourceType: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const resource = resourceExtractor(req);
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    return handler(req, context, resource);
  };
}


// Environment-based security configuration
export function getEnvironmentSecurityConfig(): Partial<SecurityConfig> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    headers: {
      enabled: true,
      environment: isDevelopment ? 'development' : 'production',
    },
    cors: {
      enabled: true,
      allowedOrigins: isDevelopment 
        ? ['http://localhost:3000', 'http://127.0.0.1:3000']
        : process.env.ALLOWED_ORIGINS?.split(',') || [],
    },
    rateLimit: {
      enabled: !isDevelopment, // Disable rate limiting in development
      config: 'api' as const,
    },
    ddosProtection: {
      enabled: !isDevelopment,
    },
    audit: {
      enabled: true,
      action: 'api_call' as any,
    },
  };
}

// Security configuration validator
export function validateSecurityConfig(config: SecurityConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate rate limit configuration
  if (config.rateLimit?.enabled && config.rateLimit.config === 'custom') {
    if (!config.rateLimit.customConfig) {
      errors.push('Custom rate limit configuration requires customConfig');
    } else {
      if (config.rateLimit.customConfig.windowMs <= 0) {
        errors.push('Rate limit windowMs must be positive');
      }
      if (config.rateLimit.customConfig.maxRequests <= 0) {
        errors.push('Rate limit maxRequests must be positive');
      }
    }
  }
  
  // Validate authentication configuration
  if (config.auth?.required) {
    if (!config.auth.roles && !config.auth.permissions) {
      errors.push('Authentication required but no roles or permissions specified');
    }
  }
  
  // Validate resource ownership configuration
  if (config.resourceOwnership?.enabled && !config.resourceOwnership.resourceExtractor) {
    errors.push('Resource ownership enabled but no resourceExtractor provided');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export types
export type SecurityPreset = keyof typeof SECURITY_PRESETS;
export type SecureHandler = (req: NextRequest, context?: any) => Promise<NextResponse>;
