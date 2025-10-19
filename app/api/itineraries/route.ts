import { NextRequest, NextResponse } from 'next/server';

import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withValidation } from '@/lib/middleware/validation';
import { withQueryValidation } from '@/lib/middleware/validation';
import { ItineraryService } from '@/services/itinerary.service';
import { createItinerarySchema } from '@/lib/validations/schemas';
import { itineraryQuerySchema } from '@/lib/validations/schemas';

const itineraryService = new ItineraryService();
const rateLimit = withRateLimit();

export async function GET(request: NextRequest) {
  return withQueryValidation(
    itineraryQuerySchema,
    async (req, queryData) => {
      return withAuth(
        req,
        async (authReq, token) => {
          try {
            const { page, limit, status, destination, startDate, endDate } = queryData;
            const pageNum = parseInt(page || '1', 10) || 1;
            const limitNum = parseInt(limit || '10', 10) || 10;
            
            const filters: any = {};
            if (status) filters.status = status;
            if (destination) filters.destination = destination;
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;

            const { itineraries, total } = await itineraryService.getUserItineraries(
              token.uid as string,
              pageNum,
              limitNum,
              filters
            );

            return NextResponse.json({
              success: true,
              data: itineraries,
              pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
              },
            });
          } catch (error) {
            console.error('Error fetching itineraries:', error);
            return NextResponse.json(
              { success: false, error: 'Failed to fetch itineraries' },
              { status: 500 }
            );
          }
        }
      );
    }
  );
}

export async function POST(request: NextRequest) {
  return withValidation(
    createItinerarySchema,
    async (req, data) => {
      return withAuth(
        req,
        async (authReq, token) => {
          try {
            const itinerary = await itineraryService.createItinerary(
              token.uid as string,
              data
            );

            return NextResponse.json({
              success: true,
              data: itinerary,
              message: 'Itinerary created successfully',
            }, { status: 201 });
          } catch (error) {
            console.error('Error creating itinerary:', error);
            return NextResponse.json(
              { success: false, error: 'Failed to create itinerary' },
              { status: 500 }
            );
          }
        }
      );
    }
  );
}
