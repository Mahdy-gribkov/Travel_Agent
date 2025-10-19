/**
 * API testing helpers and utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMockRequest, createMockResponse } from './test-utils';

export interface ApiTestConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

export class ApiTestHelper {
  private config: ApiTestConfig;

  constructor(config: ApiTestConfig = {}) {
    this.config = {
      baseUrl: 'http://localhost:3000',
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      ...config,
    };
  }

  /**
   * Test GET request
   */
  async testGet(
    endpoint: string,
    options: {
      headers?: Record<string, string>;
      query?: Record<string, string>;
      expectedStatus?: number;
      expectedData?: any;
    } = {}
  ): Promise<{ request: NextRequest; response: NextResponse; data: any }> {
    const url = this.buildUrl(endpoint, options.query);
    const request = createMockRequest('GET', url, undefined, {
      ...this.config.defaultHeaders,
      ...options.headers,
    });

    // Mock the handler execution
    const response = await this.executeRequest(request);
    
    if (options.expectedStatus && response.status !== options.expectedStatus) {
      throw new Error(`Expected status ${options.expectedStatus}, got ${response.status}`);
    }

    const data = await response.json();
    
    if (options.expectedData) {
      this.assertResponseData(data, options.expectedData);
    }

    return { request, response, data };
  }

  /**
   * Test POST request
   */
  async testPost(
    endpoint: string,
    body: any,
    options: {
      headers?: Record<string, string>;
      expectedStatus?: number;
      expectedData?: any;
    } = {}
  ): Promise<{ request: NextRequest; response: NextResponse; data: any }> {
    const url = this.buildUrl(endpoint);
    const request = createMockRequest('POST', url, body, {
      ...this.config.defaultHeaders,
      ...options.headers,
    });

    const response = await this.executeRequest(request);
    
    if (options.expectedStatus && response.status !== options.expectedStatus) {
      throw new Error(`Expected status ${options.expectedStatus}, got ${response.status}`);
    }

    const data = await response.json();
    
    if (options.expectedData) {
      this.assertResponseData(data, options.expectedData);
    }

    return { request, response, data };
  }

  /**
   * Test PUT request
   */
  async testPut(
    endpoint: string,
    body: any,
    options: {
      headers?: Record<string, string>;
      expectedStatus?: number;
      expectedData?: any;
    } = {}
  ): Promise<{ request: NextRequest; response: NextResponse; data: any }> {
    const url = this.buildUrl(endpoint);
    const request = createMockRequest('PUT', url, body, {
      ...this.config.defaultHeaders,
      ...options.headers,
    });

    const response = await this.executeRequest(request);
    
    if (options.expectedStatus && response.status !== options.expectedStatus) {
      throw new Error(`Expected status ${options.expectedStatus}, got ${response.status}`);
    }

    const data = await response.json();
    
    if (options.expectedData) {
      this.assertResponseData(data, options.expectedData);
    }

    return { request, response, data };
  }

  /**
   * Test DELETE request
   */
  async testDelete(
    endpoint: string,
    options: {
      headers?: Record<string, string>;
      expectedStatus?: number;
      expectedData?: any;
    } = {}
  ): Promise<{ request: NextRequest; response: NextResponse; data: any }> {
    const url = this.buildUrl(endpoint);
    const request = createMockRequest('DELETE', url, undefined, {
      ...this.config.defaultHeaders,
      ...options.headers,
    });

    const response = await this.executeRequest(request);
    
    if (options.expectedStatus && response.status !== options.expectedStatus) {
      throw new Error(`Expected status ${options.expectedStatus}, got ${response.status}`);
    }

    const data = await response.json();
    
    if (options.expectedData) {
      this.assertResponseData(data, options.expectedData);
    }

    return { request, response, data };
  }

  /**
   * Test authentication flow
   */
  async testAuthFlow(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<{
    unauthenticated: { request: NextRequest; response: NextResponse; data: any };
    authenticated: { request: NextRequest; response: NextResponse; data: any };
  }> {
    // Test without authentication
    const unauthenticated = await this.testRequest(method, endpoint, body, {
      expectedStatus: 401,
    });

    // Test with authentication
    const authenticated = await this.testRequest(method, endpoint, body, {
      headers: {
        'Authorization': 'Bearer test-token',
      },
    });

    return { unauthenticated, authenticated };
  }

  /**
   * Test rate limiting
   */
  async testRateLimit(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    maxRequests: number = 10
  ): Promise<{
    requests: Array<{ request: NextRequest; response: NextResponse; data: any }>;
    rateLimited: { request: NextRequest; response: NextResponse; data: any };
  }> {
    const requests = [];
    
    // Make requests up to the limit
    for (let i = 0; i < maxRequests; i++) {
      const result = await this.testRequest(method, endpoint, body);
      requests.push(result);
    }

    // Make one more request that should be rate limited
    const rateLimited = await this.testRequest(method, endpoint, body, {
      expectedStatus: 429,
    });

    return { requests, rateLimited };
  }

  /**
   * Test input validation
   */
  async testValidation(
    endpoint: string,
    validData: any,
    invalidData: any,
    method: 'POST' | 'PUT' = 'POST'
  ): Promise<{
    valid: { request: NextRequest; response: NextResponse; data: any };
    invalid: { request: NextRequest; response: NextResponse; data: any };
  }> {
    // Test with valid data
    const valid = await this.testRequest(method, endpoint, validData, {
      expectedStatus: 200,
    });

    // Test with invalid data
    const invalid = await this.testRequest(method, endpoint, invalidData, {
      expectedStatus: 400,
    });

    return { valid, invalid };
  }

  /**
   * Generic request tester
   */
  private async testRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any,
    options: {
      headers?: Record<string, string>;
      query?: Record<string, string>;
      expectedStatus?: number;
      expectedData?: any;
    } = {}
  ): Promise<{ request: NextRequest; response: NextResponse; data: any }> {
    switch (method) {
      case 'GET':
        return this.testGet(endpoint, options);
      case 'POST':
        return this.testPost(endpoint, body, options);
      case 'PUT':
        return this.testPut(endpoint, body, options);
      case 'DELETE':
        return this.testDelete(endpoint, options);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, query?: Record<string, string>): string {
    const url = new URL(endpoint, this.config.baseUrl);
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    return url.toString();
  }

  /**
   * Execute request (mock implementation)
   */
  private async executeRequest(request: NextRequest): Promise<NextResponse> {
    // In a real test environment, this would execute the actual API handler
    // For now, we'll return a mock response
    return createMockResponse({ success: true, message: 'Mock response' });
  }

  /**
   * Assert response data matches expected data
   */
  private assertResponseData(actual: any, expected: any): void {
    if (typeof expected === 'object' && expected !== null) {
      Object.entries(expected).forEach(([key, value]) => {
        if (actual[key] !== value) {
          throw new Error(`Expected ${key} to be ${value}, got ${actual[key]}`);
        }
      });
    } else if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}`);
    }
  }
}

// Test suite helpers
export class ApiTestSuite {
  private helper: ApiTestHelper;
  private results: Array<{
    test: string;
    passed: boolean;
    error?: string;
    duration: number;
  }> = [];

  constructor(config?: ApiTestConfig) {
    this.helper = new ApiTestHelper(config);
  }

  /**
   * Run a test case
   */
  async runTest(
    name: string,
    testFn: (helper: ApiTestHelper) => Promise<void>
  ): Promise<void> {
    const start = Date.now();
    
    try {
      await testFn(this.helper);
      this.results.push({
        test: name,
        passed: true,
        duration: Date.now() - start,
      });
    } catch (error) {
      this.results.push({
        test: name,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start,
      });
    }
  }

  /**
   * Get test results
   */
  getResults(): Array<{
    test: string;
    passed: boolean;
    error?: string;
    duration: number;
  }> {
    return [...this.results];
  }

  /**
   * Get test summary
   */
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
    totalDuration: number;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      passed,
      failed,
      successRate: Math.round(successRate * 100) / 100,
      totalDuration,
    };
  }
}

// Common test scenarios
export const commonTestScenarios = {
  /**
   * Test health check endpoint
   */
  async testHealthCheck(helper: ApiTestHelper): Promise<void> {
    const { data } = await helper.testGet('/api/health', {
      expectedStatus: 200,
    });

    if (!data.status || !data.timestamp) {
      throw new Error('Health check response missing required fields');
    }
  },

  /**
   * Test metrics endpoint
   */
  async testMetrics(helper: ApiTestHelper): Promise<void> {
    const { data } = await helper.testGet('/api/metrics', {
      expectedStatus: 200,
    });

    if (!data.success || !data.data) {
      throw new Error('Metrics response missing required fields');
    }
  },

  /**
   * Test weather API
   */
  async testWeatherAPI(helper: ApiTestHelper): Promise<void> {
    const { data } = await helper.testGet('/api/weather', {
      query: { location: 'Paris', type: 'current' },
      expectedStatus: 200,
    });

    if (!data.success || !data.data) {
      throw new Error('Weather API response missing required fields');
    }
  },

  /**
   * Test flights API
   */
  async testFlightsAPI(helper: ApiTestHelper): Promise<void> {
    const { data } = await helper.testGet('/api/flights', {
      query: {
        origin: 'JFK',
        destination: 'CDG',
        departureDate: '2024-06-01',
        returnDate: '2024-06-07',
        adults: '2',
      },
      expectedStatus: 200,
    });

    if (!data.success || !data.data) {
      throw new Error('Flights API response missing required fields');
    }
  },

  /**
   * Test places API
   */
  async testPlacesAPI(helper: ApiTestHelper): Promise<void> {
    const { data } = await helper.testGet('/api/places', {
      query: { query: 'Eiffel Tower', location: 'Paris' },
      expectedStatus: 200,
    });

    if (!data.success || !data.data) {
      throw new Error('Places API response missing required fields');
    }
  },
};
