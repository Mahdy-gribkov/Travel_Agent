import { NextRequest, NextResponse } from 'next/server';

import { withQueryValidation } from '@/lib/middleware/validation';
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
  return withAuth(
    request,
    async (authReq, token) => {
      try {
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        
        // Parse and validate query parameters
        const origin = queryParams.origin;
        const destination = queryParams.destination;
        const departureDate = queryParams.departureDate;
        const returnDate = queryParams.returnDate;
        const adults = parseInt(queryParams.adults || '1', 10);
        const children = queryParams.children ? parseInt(queryParams.children, 10) : undefined;
        const infants = queryParams.infants ? parseInt(queryParams.infants, 10) : undefined;
        const travelClass = queryParams.travelClass as 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST' | undefined;
        const nonStop = queryParams.nonStop === 'true';
        const maxPrice = queryParams.maxPrice ? parseInt(queryParams.maxPrice, 10) : undefined;
        const currency = queryParams.currency || 'USD';

        if (!origin || !destination || !departureDate) {
          return NextResponse.json(
            { success: false, error: 'Missing required parameters: origin, destination, departureDate' },
            { status: 400 }
          );
        }

        const flightService = new FlightService();
        
        const flightOffers = await flightService.searchFlights({
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

        return NextResponse.json({
          success: true,
          data: {
            offers: flightOffers,
            searchParams: {
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
            },
            totalResults: flightOffers.length,
          },
          message: `Found ${flightOffers.length} flight offers`,
        });
      } catch (error) {
        console.error('Error searching flights:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to search flights' },
          { status: 500 }
        );
      }
    }
  );
}
