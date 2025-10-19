/**
 * Testing utilities and helpers
 */

import { NextRequest, NextResponse } from 'next/server';
import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';
// Removed NextAuth import - no longer needed

// Mock data generators
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  preferences: {
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    travelStyle: {
      budget: 'mid-range',
      pace: 'moderate',
      accommodation: 'hotel',
      transportation: 'public',
      groupSize: 'solo',
    },
    interests: ['culture', 'food', 'nature'],
    accessibility: {
      mobility: false,
      visual: false,
      hearing: false,
      cognitive: false,
    },
    dietary: {
      restrictions: [],
      allergies: [],
      preferences: [],
    },
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockItinerary = {
  id: 'test-itinerary-123',
  userId: 'test-user-123',
  title: 'Test Itinerary',
  destination: 'Paris, France',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-07'),
  travelers: 2,
  budget: 3000,
  status: 'draft',
  days: [
    {
      day: 1,
      date: new Date('2024-06-01'),
      activities: [
        {
          id: 'activity-1',
          name: 'Eiffel Tower Visit',
          type: 'attraction' as const,
          description: 'Visit the iconic Eiffel Tower',
          location: {
            name: 'Eiffel Tower',
            address: 'Champ de Mars, 7th arrondissement, Paris',
            city: 'Paris',
            country: 'France',
            coordinates: { lat: 48.8584, lng: 2.2945 },
          },
          duration: 120,
          cost: 25,
          rating: 4.5,
          bookingRequired: true,
          accessibility: {
            wheelchairAccessible: true,
            visualAccessibility: true,
            hearingAccessibility: false,
            cognitiveAccessibility: true,
          },
          sustainability: {
            ecoFriendly: true,
            carbonFootprint: 5,
            localBusiness: true,
            sustainableTransport: true,
          },
          timeSlot: {
            start: '10:00',
            end: '12:00',
            flexible: false,
          },
        },
      ],
      estimatedCost: 100,
      notes: 'First day in Paris',
    },
  ],
  metadata: {
    totalCost: 3000,
    sustainabilityScore: 85,
    accessibilityScore: 90,
    tags: ['paris', 'culture', 'attractions'],
    source: 'ai-generated',
    version: 1,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockChatSession = {
  id: 'test-chat-123',
  userId: 'test-user-123',
  title: 'Test Chat Session',
  messages: [
    {
      id: 'msg-1',
      content: 'Hello, I need help planning a trip to Paris',
      role: 'user' as const,
      timestamp: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: 'msg-2',
      content: 'I\'d be happy to help you plan your trip to Paris! What are your interests?',
      role: 'assistant' as const,
      timestamp: new Date('2024-01-01T10:01:00Z'),
    },
  ],
  context: {
    currentItinerary: mockItinerary.id,
    activeTools: ['weather', 'flights', 'places'],
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// Mock API responses
export const mockWeatherResponse = {
  success: true,
  data: {
    location: 'Paris, France',
    current: {
      temperature: 22,
      condition: 'Sunny',
      humidity: 60,
      windSpeed: 10,
      icon: '01d',
    },
    forecast: [
      {
        date: '2024-06-01',
        high: 25,
        low: 18,
        condition: 'Sunny',
        icon: '01d',
      },
      {
        date: '2024-06-02',
        high: 23,
        low: 16,
        condition: 'Partly Cloudy',
        icon: '02d',
      },
    ],
  },
  message: 'Weather data retrieved successfully',
};

export const mockFlightResponse = {
  success: true,
  data: {
    offers: [
      {
        id: 'flight-1',
        price: 450,
        currency: 'USD',
        departure: {
          airport: 'JFK',
          time: '2024-06-01T08:00:00Z',
        },
        arrival: {
          airport: 'CDG',
          time: '2024-06-01T20:00:00Z',
        },
        airline: 'Air France',
        duration: '8h 30m',
      },
    ],
  },
  message: 'Flight search completed',
};

export const mockPlacesResponse = {
  success: true,
  data: {
    places: [
      {
        id: 'place-1',
        name: 'Eiffel Tower',
        address: 'Champ de Mars, 7th arrondissement, Paris',
        rating: 4.5,
        priceLevel: 2,
        types: ['tourist_attraction', 'landmark'],
        photos: ['https://example.com/eiffel-tower.jpg'],
        coordinates: { lat: 48.8584, lng: 2.2945 },
      },
    ],
  },
  message: 'Places search completed',
};

// Test utilities
export function createMockRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000/api/test',
  body?: any,
  headers: Record<string, string> = {}
): NextRequest {
  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  
  return request;
}

export function createMockResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

// React Testing Library utilities
export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, options);

// Mock functions (for testing only)
export const mockFetch = async () => new Response('{}', { status: 200 });
export const mockConsole = {
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
};

// Test data factories
export class TestDataFactory {
  static createUser(overrides: Partial<typeof mockUser> = {}): typeof mockUser {
    return { ...mockUser, ...overrides };
  }

  static createItinerary(overrides: Partial<typeof mockItinerary> = {}): typeof mockItinerary {
    return { ...mockItinerary, ...overrides };
  }

  static createChatSession(overrides: Partial<typeof mockChatSession> = {}): typeof mockChatSession {
    return { ...mockChatSession, ...overrides };
  }

  static createWeatherResponse(overrides: Partial<typeof mockWeatherResponse> = {}): typeof mockWeatherResponse {
    return { ...mockWeatherResponse, ...overrides };
  }

  static createFlightResponse(overrides: Partial<typeof mockFlightResponse> = {}): typeof mockFlightResponse {
    return { ...mockFlightResponse, ...overrides };
  }

  static createPlacesResponse(overrides: Partial<typeof mockPlacesResponse> = {}): typeof mockPlacesResponse {
    return { ...mockPlacesResponse, ...overrides };
  }
}

// Async testing utilities
export async function waitFor(condition: () => boolean, timeout: number = 5000): Promise<void> {
  const start = Date.now();
  
  while (!condition() && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`);
  }
}

export async function waitForElement(selector: string, timeout: number = 5000): Promise<Element> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

// Mock external services (for testing only)
export const mockExternalServices = {
  weather: {
    getCurrentWeather: () => Promise.resolve(mockWeatherResponse.data.current),
    getWeatherForecast: () => Promise.resolve(mockWeatherResponse.data.forecast),
  },
  flights: {
    searchFlights: () => Promise.resolve(mockFlightResponse.data.offers),
  },
  maps: {
    searchPlaces: () => Promise.resolve(mockPlacesResponse.data.places),
    getPlaceDetails: () => Promise.resolve(mockPlacesResponse.data.places[0]),
    getDirections: () => Promise.resolve({
      routes: [{
        distance: '2.5 km',
        duration: '15 minutes',
        steps: ['Walk to station', 'Take metro', 'Walk to destination'],
      }],
    }),
  },
  countries: {
    getAllCountries: () => Promise.resolve([
      { name: 'France', code: 'FR', capital: 'Paris' },
      { name: 'Italy', code: 'IT', capital: 'Rome' },
    ]),
    getCountryByName: () => Promise.resolve({
      name: 'France',
      code: 'FR',
      capital: 'Paris',
      population: 67000000,
      currency: 'EUR',
    }),
  },
};

// Test environment setup
export function setupTestEnvironment(): void {
  // Mock fetch globally
  global.fetch = mockFetch;
  
  // Mock console methods
  global.console = { ...console, ...mockConsole };
  
  // Set test environment variables (would be handled by Jest in actual tests)
  // process.env.NODE_ENV = 'test';
  // process.env.APP_API_KEY = 'test-api-key';
  
  // Mock Next.js router (for testing only)
  // This would be handled by Jest mocks in actual test files
}

// Cleanup utilities
export function cleanupTestEnvironment(): void {
  // This would be handled by Jest in actual test files
}

// Performance testing utilities
export function measurePerformance<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  return { result, duration };
}

export async function measureAsyncPerformance<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  return { result, duration };
}
