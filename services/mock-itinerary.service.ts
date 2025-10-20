/**
 * Mock Itinerary Service for Development
 * This service provides mock data when Firebase is not configured
 */

export interface MockItinerary {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  days: any[];
  createdAt: Date;
  updatedAt: Date;
}

export class MockItineraryService {
  private mockItineraries: MockItinerary[] = [
    {
      id: 'mock-1',
      userId: 'default-user',
      title: 'Paris Adventure',
      destination: 'Paris, France',
      startDate: '2024-02-15',
      endDate: '2024-02-18',
      travelers: 2,
      budget: 2000,
      status: 'confirmed',
      days: [
        {
          day: 1,
          date: '2024-02-15',
          activities: [
            {
              id: 'activity-1',
              name: 'Visit Eiffel Tower',
              description: 'Iconic iron tower with city views',
              time: '10:00',
              location: 'Champ de Mars, 7th arrondissement',
              duration: '2 hours',
              cost: 25,
              type: 'attraction'
            },
            {
              id: 'activity-2',
              name: 'Lunch at Café de Flore',
              description: 'Historic café in Saint-Germain-des-Prés',
              time: '13:00',
              location: '172 Boulevard Saint-Germain',
              duration: '1 hour',
              cost: 45,
              type: 'restaurant'
            }
          ]
        },
        {
          day: 2,
          date: '2024-02-16',
          activities: [
            {
              id: 'activity-3',
              name: 'Louvre Museum',
              description: 'World-famous art museum',
              time: '09:00',
              location: 'Rue de Rivoli',
              duration: '4 hours',
              cost: 17,
              type: 'attraction'
            }
          ]
        }
      ],
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T11:30:00Z')
    },
    {
      id: 'mock-2',
      userId: 'default-user',
      title: 'Tokyo Discovery',
      destination: 'Tokyo, Japan',
      startDate: '2024-03-10',
      endDate: '2024-03-15',
      travelers: 1,
      budget: 3000,
      status: 'draft',
      days: [],
      createdAt: new Date('2024-01-20T14:00:00Z'),
      updatedAt: new Date('2024-01-20T14:00:00Z')
    }
  ];

  async getUserItineraries(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters: any = {}
  ): Promise<{ itineraries: MockItinerary[]; total: number }> {
    let filteredItineraries = this.mockItineraries.filter(itinerary => 
      itinerary.userId === userId
    );

    // Apply filters
    if (filters.status) {
      filteredItineraries = filteredItineraries.filter(itinerary => 
        itinerary.status === filters.status
      );
    }

    if (filters.destination) {
      filteredItineraries = filteredItineraries.filter(itinerary => 
        itinerary.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItineraries = filteredItineraries.slice(startIndex, endIndex);

    return {
      itineraries: paginatedItineraries,
      total: filteredItineraries.length
    };
  }

  async createItinerary(userId: string, itineraryData: any): Promise<MockItinerary> {
    const newItinerary: MockItinerary = {
      id: `mock-${Date.now()}`,
      userId,
      title: itineraryData.title || 'New Itinerary',
      destination: itineraryData.destination || 'Unknown Destination',
      startDate: itineraryData.startDate || new Date().toISOString().split('T')[0],
      endDate: itineraryData.endDate || new Date().toISOString().split('T')[0],
      travelers: itineraryData.travelers || 1,
      budget: itineraryData.budget || 1000,
      status: 'draft',
      days: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.mockItineraries.push(newItinerary);
    return newItinerary;
  }

  async getItineraryById(id: string): Promise<MockItinerary | null> {
    return this.mockItineraries.find(itinerary => itinerary.id === id) || null;
  }

  async updateItinerary(id: string, updateData: any): Promise<MockItinerary | null> {
    const index = this.mockItineraries.findIndex(itinerary => itinerary.id === id);
    if (index === -1) return null;

    this.mockItineraries[index] = {
      ...this.mockItineraries[index],
      ...updateData,
      updatedAt: new Date()
    };

    return this.mockItineraries[index];
  }

  async deleteItinerary(id: string): Promise<boolean> {
    const index = this.mockItineraries.findIndex(itinerary => itinerary.id === id);
    if (index === -1) return false;

    this.mockItineraries.splice(index, 1);
    return true;
  }
}
