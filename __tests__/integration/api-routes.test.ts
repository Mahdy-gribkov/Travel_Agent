/**
 * Integration tests for API routes
 */

import { NextRequest } from 'next/server';

// Mock Firebase Admin
jest.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(),
          })),
        })),
      })),
      get: jest.fn(),
    })),
  },
}));

// Mock services
jest.mock('@/services/ai/agent.service', () => ({
  AIAgentService: jest.fn().mockImplementation(() => ({
    processMessage: jest.fn(),
    getConversationHistory: jest.fn(),
    getAgentStats: jest.fn(),
  })),
}));

jest.mock('@/services/chat.service', () => ({
  ChatService: jest.fn().mockImplementation(() => ({
    createChatSession: jest.fn(),
    getChatSession: jest.fn(),
    addMessage: jest.fn(),
    processMessageWithAI: jest.fn(),
    getUserChatSessions: jest.fn(),
    updateChatSession: jest.fn(),
    deleteChatSession: jest.fn(),
    searchChatSessions: jest.fn(),
    getAgentStats: jest.fn(),
  })),
}));

jest.mock('@/services/itinerary.service', () => ({
  ItineraryService: jest.fn().mockImplementation(() => ({
    createItinerary: jest.fn(),
    getItineraryById: jest.fn(),
    getUserItineraries: jest.fn(),
    updateItinerary: jest.fn(),
    deleteItinerary: jest.fn(),
  })),
}));

jest.mock('@/services/user.service', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    createUser: jest.fn(),
    getUserById: jest.fn(),
    getAllUsers: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  })),
}));

jest.mock('@/services/external/countries.service', () => ({
  CountriesService: jest.fn().mockImplementation(() => ({
    getAllCountries: jest.fn(),
    searchCountries: jest.fn(),
    getCountryByCode: jest.fn(),
    getCountriesByRegion: jest.fn(),
    getCountriesBySubregion: jest.fn(),
    getCountriesByCapital: jest.fn(),
    getCountriesByLanguage: jest.fn(),
    getCountriesByCurrency: jest.fn(),
    getPopularDestinations: jest.fn(),
    getCountriesByContinent: jest.fn(),
  })),
}));

jest.mock('@/services/external/maps.service', () => ({
  MapsService: jest.fn().mockImplementation(() => ({
    searchPlaces: jest.fn(),
    getNearbyPlaces: jest.fn(),
    getPlaceDetails: jest.fn(),
    getDirections: jest.fn(),
  })),
}));

jest.mock('@/services/external/flight.service', () => ({
  FlightService: jest.fn().mockImplementation(() => ({
    searchFlights: jest.fn(),
  })),
}));

jest.mock('@/services/ai/vector.service', () => ({
  VectorService: jest.fn().mockImplementation(() => ({
    searchSimilar: jest.fn(),
    searchByType: jest.fn(),
    searchByLocation: jest.fn(),
  })),
}));

describe('API Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Countries API', () => {
    it('should handle GET /api/countries', async () => {
      const { GET } = await import('@/app/api/countries/route');
      
      const mockCountries = [
        { name: 'United States', code: 'US' },
        { name: 'Canada', code: 'CA' },
      ];

      const { CountriesService } = require('@/services/external/countries.service');
      const mockService = new CountriesService();
      mockService.getAllCountries.mockResolvedValue(mockCountries);

      const request = new NextRequest('http://localhost:3000/api/countries');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCountries);
    });

    it('should handle search countries', async () => {
      const { GET } = await import('@/app/api/countries/route');
      
      const mockCountries = [
        { name: 'United States', code: 'US' },
      ];

      const { CountriesService } = require('@/services/external/countries.service');
      const mockService = new CountriesService();
      mockService.searchCountries.mockResolvedValue(mockCountries);

      const request = new NextRequest('http://localhost:3000/api/countries?action=search&query=United');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCountries);
    });
  });

  describe('Places API', () => {
    it('should handle GET /api/places with search action', async () => {
      const { GET } = await import('@/app/api/places/route');
      
      const mockPlaces = [
        { name: 'Eiffel Tower', place_id: '123' },
        { name: 'Louvre Museum', place_id: '456' },
      ];

      const { MapsService } = require('@/services/external/maps.service');
      const mockService = new MapsService();
      mockService.searchPlaces.mockResolvedValue(mockPlaces);

      const request = new NextRequest('http://localhost:3000/api/places?action=search&query=Paris');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPlaces);
    });

    it('should handle nearby places search', async () => {
      const { GET } = await import('@/app/api/places/route');
      
      const mockPlaces = [
        { name: 'Nearby Restaurant', place_id: '789' },
      ];

      const { MapsService } = require('@/services/external/maps.service');
      const mockService = new MapsService();
      mockService.getNearbyPlaces.mockResolvedValue(mockPlaces);

      const request = new NextRequest('http://localhost:3000/api/places?action=nearby&location=48.8566,2.3522');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPlaces);
    });
  });

  describe('Flights API', () => {
    it('should handle GET /api/flights', async () => {
      const { GET } = await import('@/app/api/flights/route');
      
      const mockFlights = [
        {
          airline: 'Airline A',
          departure: '08:00',
          arrival: '10:30',
          price: 299,
        },
      ];

      const { FlightService } = require('@/services/external/flight.service');
      const mockService = new FlightService();
      mockService.searchFlights.mockResolvedValue(mockFlights);

      const request = new NextRequest('http://localhost:3000/api/flights?origin=LAX&destination=JFK&departureDate=2024-01-15');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockFlights);
    });
  });

  describe('Directions API', () => {
    it('should handle GET /api/directions', async () => {
      const { GET } = await import('@/app/api/directions/route');
      
      const mockDirections = [
        {
          distance: '2.5 km',
          duration: '15 mins',
          steps: ['Start at point A', 'Turn right', 'Arrive at point B'],
        },
      ];

      const { MapsService } = require('@/services/external/maps.service');
      const mockService = new MapsService();
      mockService.getDirections.mockResolvedValue(mockDirections);

      const request = new NextRequest('http://localhost:3000/api/directions?origin=Paris&destination=Lyon&mode=driving');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockDirections);
    });
  });

  describe('AI Search API', () => {
    it('should handle GET /api/ai/search', async () => {
      const { GET } = await import('@/app/api/ai/search/route');
      
      const mockResults = [
        {
          id: '1',
          content: 'Travel guide for Paris',
          metadata: {
            title: 'Paris Travel Guide',
            type: 'guide',
            location: 'Paris',
          },
        },
      ];

      const { VectorService } = require('@/services/ai/vector.service');
      const mockService = new VectorService();
      mockService.searchSimilar.mockResolvedValue(mockResults);

      const request = new NextRequest('http://localhost:3000/api/ai/search?query=Paris travel');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.results).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const { GET } = await import('@/app/api/countries/route');
      
      const { CountriesService } = require('@/services/external/countries.service');
      const mockService = new CountriesService();
      mockService.getAllCountries.mockRejectedValue(new Error('Service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/countries');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch countries data');
    });

    it('should handle validation errors', async () => {
      const { GET } = await import('@/app/api/places/route');
      
      const request = new NextRequest('http://localhost:3000/api/places?action=search');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Query parameter is required for search');
    });
  });

  describe('Input Validation', () => {
    it('should validate required parameters', async () => {
      const { GET } = await import('@/app/api/flights/route');
      
      const request = new NextRequest('http://localhost:3000/api/flights?origin=LAX');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate parameter formats', async () => {
      const { GET } = await import('@/app/api/flights/route');
      
      const request = new NextRequest('http://localhost:3000/api/flights?origin=LAX&destination=JFK&departureDate=invalid-date');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});
