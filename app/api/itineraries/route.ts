import { NextRequest, NextResponse } from 'next/server';
import { ItineraryService } from '@/services/itinerary.service';
import { MockItineraryService } from '@/services/mock-itinerary.service';
import { createItinerarySchema } from '@/lib/validations/schemas';
import { itineraryQuerySchema } from '@/lib/validations/schemas';

// Use mock service if Firebase is not configured
const useMockService = !process.env.FIREBASE_PROJECT_ID;
const itineraryService = useMockService ? new MockItineraryService() : new ItineraryService();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const limit = url.searchParams.get('limit');
    const status = url.searchParams.get('status');
    const destination = url.searchParams.get('destination');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const queryData = itineraryQuerySchema.parse({
      page,
      limit,
      status,
      destination,
      startDate,
      endDate,
    });

    const { page: validatedPage, limit: validatedLimit, status: validatedStatus, destination: validatedDestination, startDate: validatedStartDate, endDate: validatedEndDate } = queryData;
    const pageNum = parseInt(validatedPage || '1', 10) || 1;
    const limitNum = parseInt(validatedLimit || '10', 10) || 10;
    
    const filters: any = {};
    if (validatedStatus) filters.status = validatedStatus;
    if (validatedDestination) filters.destination = validatedDestination;
    if (validatedStartDate) filters.startDate = validatedStartDate;
    if (validatedEndDate) filters.endDate = validatedEndDate;

    // For now, use a default user ID since we don't have session-based auth
    const userId = 'default-user';
    
    const result = await itineraryService.getUserItineraries(userId, pageNum, limitNum, filters);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Itineraries retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch itineraries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const itineraryData = createItinerarySchema.parse(body);
    
    // For now, use a default user ID since we don't have session-based auth
    const userId = 'default-user';
    
    const itinerary = await itineraryService.createItinerary(userId, itineraryData);

    return NextResponse.json({
      success: true,
      data: itinerary,
      message: 'Itinerary created successfully',
    });
  } catch (error) {
    console.error('Error creating itinerary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create itinerary' },
      { status: 500 }
    );
  }
}