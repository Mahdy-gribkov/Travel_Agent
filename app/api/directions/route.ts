import { NextRequest, NextResponse } from 'next/server';
import { MapsService } from '@/services/external/maps.service';
import { z } from 'zod';

const directionsQuerySchema = z.object({
  origin: z.string().min(1).max(200),
  destination: z.string().min(1).max(200),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).default('driving'),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const origin = url.searchParams.get('origin');
    const destination = url.searchParams.get('destination');
    const mode = url.searchParams.get('mode') || 'driving';

    // Validate query parameters
    const queryData = directionsQuerySchema.parse({
      origin,
      destination,
      mode,
    });

    const { origin: validatedOrigin, destination: validatedDestination, mode: validatedMode } = queryData;
    const mapsService = new MapsService();

    const routes = await mapsService.getDirections(validatedOrigin, validatedDestination, validatedMode);

    return NextResponse.json({
      success: true,
      data: {
        routes,
        origin: validatedOrigin,
        destination: validatedDestination,
        mode: validatedMode,
        totalRoutes: routes.length,
      },
      message: 'Directions retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching directions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch directions' },
      { status: 500 }
    );
  }
}