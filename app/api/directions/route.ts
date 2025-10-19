import { NextRequest, NextResponse } from 'next/server';

import { withQueryValidation } from '@/lib/middleware/validation';
import { MapsService } from '@/services/external/maps.service';
import { z } from 'zod';

const directionsQuerySchema = z.object({
  origin: z.string().min(1).max(200),
  destination: z.string().min(1).max(200),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).default('driving'),
});

export async function GET(request: NextRequest) {
  // Skip during static generation
  if (process.env.NODE_ENV === 'production' && !request.headers.get('authorization')) {
    return NextResponse.json({ success: false, error: 'Not available during build' }, { status: 503 });
  }

  return withQueryValidation(
    directionsQuerySchema,
    async (req, queryData) => {
      return withAuth(
        req,
        async (authReq, token) => {
          try {
            const { origin, destination, mode } = queryData;
            const mapsService = new MapsService();

            const routes = await mapsService.getDirections(origin, destination, mode);

            if (routes.length === 0) {
              return NextResponse.json(
                { success: false, error: 'No routes found' },
                { status: 404 }
              );
            }

            return NextResponse.json({
              success: true,
              data: {
                routes,
                searchParams: {
                  origin,
                  destination,
                  mode,
                },
                totalRoutes: routes.length,
              },
              message: `Found ${routes.length} route(s) from ${origin} to ${destination}`,
            });
          } catch (error) {
            console.error('Error getting directions:', error);
            return NextResponse.json(
              { success: false, error: 'Failed to get directions' },
              { status: 500 }
            );
          }
        }
      );
    }
  );
}
