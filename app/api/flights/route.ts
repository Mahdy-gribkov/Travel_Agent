import { NextRequest, NextResponse } from 'next/server';
import { FlightService } from '@/services/external/flight.service';
import { z } from 'zod';

const flightSearchSchema = z.object({
  origin: z.string().min(3).max(3), // IATA code
  destination: z.string().min(3).max(3), // IATA code
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adults: z.string().default('1').transform(val => parseInt(val, 10)),
  children: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  infants: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  travelClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).optional(),
  nonStop: z.string().default('false').transform(val => val === 'true'),
  maxPrice: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  currency: z.string().default('USD'),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Parse and validate query parameters
    const origin = queryParams.origin;
    const destination = queryParams.destination;
    const departureDate = queryParams.departureDate;
    const returnDate = queryParams.returnDate;
    const adults = queryParams.adults || '1';
    const children = queryParams.children;
    const infants = queryParams.infants;
    const travelClass = queryParams.travelClass;
    const nonStop = queryParams.nonStop || 'false';
    const maxPrice = queryParams.maxPrice;
    const currency = queryParams.currency || 'USD';

    const searchData = flightSearchSchema.parse({
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass,
      nonStop,
      maxPrice,
      currency,
    });

    const flightService = new FlightService();
    const flights = await flightService.searchFlights(searchData);

    return NextResponse.json({
      success: true,
      data: {
        flights,
        searchCriteria: searchData,
        totalFlights: flights.length,
      },
      message: 'Flight search completed successfully',
    });
  } catch (error) {
    console.error('Error searching flights:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search flights' },
      { status: 500 }
    );
  }
}