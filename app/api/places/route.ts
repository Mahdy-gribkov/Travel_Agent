import { NextRequest, NextResponse } from 'next/server';
import { MapsService } from '@/services/external/maps.service';
import { z } from 'zod';

const placesQuerySchema = z.object({
  query: z.string().min(1).max(100),
  location: z.string().optional(), // "lat,lng" format
  radius: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  type: z.string().optional(),
  action: z.enum(['search', 'nearby', 'details']).default('search'),
  placeId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const query = queryParams.query;
    const location = queryParams.location;
    const radius = queryParams.radius ? parseInt(queryParams.radius, 10) : undefined;
    const type = queryParams.type;
    const action = queryParams.action || 'search';
    const placeId = queryParams.placeId;

    const searchData = placesQuerySchema.parse({
      query,
      location,
      radius,
      type,
      action,
      placeId,
    });

    const { query: validatedQuery, location: validatedLocation, radius: validatedRadius, type: validatedType, action: validatedAction, placeId: validatedPlaceId } = searchData;
    const mapsService = new MapsService();

    let places = [];

    switch (validatedAction) {
      case 'search':
        places = await mapsService.searchPlaces(validatedQuery, {
          location: validatedLocation,
          radius: validatedRadius,
          type: validatedType,
        });
        break;

      case 'nearby':
        if (!validatedLocation) {
          return NextResponse.json(
            { success: false, error: 'Location parameter is required for nearby search' },
            { status: 400 }
          );
        }
        places = await mapsService.getNearbyPlaces(validatedLocation, {
          radius: validatedRadius || 5000,
          type: validatedType,
        });
        break;

      case 'details':
        if (!validatedPlaceId) {
          return NextResponse.json(
            { success: false, error: 'Place ID is required for details' },
            { status: 400 }
          );
        }
        const placeDetails = await mapsService.getPlaceDetails(validatedPlaceId);
        return NextResponse.json({
          success: true,
          data: placeDetails,
          message: 'Place details retrieved successfully',
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        places,
        searchCriteria: {
          query: validatedQuery,
          location: validatedLocation,
          radius: validatedRadius,
          type: validatedType,
          action: validatedAction,
        },
        totalPlaces: places.length,
      },
      message: 'Places search completed successfully',
    });
  } catch (error) {
    console.error('Error searching places:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search places' },
      { status: 500 }
    );
  }
}