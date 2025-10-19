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
        // Parse location if provided (format: "lat,lng")
        let locationCoords: { lat: number; lng: number } | undefined;
        if (validatedLocation) {
          const coords = validatedLocation.split(',').map(coord => parseFloat(coord.trim()));
          if (coords.length === 2) {
            const lat = coords[0]!;
            const lng = coords[1]!;
            if (!isNaN(lat) && !isNaN(lng)) {
              locationCoords = { lat, lng };
            }
          }
        }
        
        places = await mapsService.searchPlaces(
          validatedQuery,
          locationCoords,
          validatedRadius,
          validatedType
        );
        break;

      case 'nearby':
        if (!validatedLocation) {
          return NextResponse.json(
            { success: false, error: 'Location parameter is required for nearby search' },
            { status: 400 }
          );
        }
        // Parse location for nearby search
        const nearbyCoords = validatedLocation.split(',').map(coord => parseFloat(coord.trim()));
        if (nearbyCoords.length !== 2 || isNaN(nearbyCoords[0]!) || isNaN(nearbyCoords[1]!)) {
          return NextResponse.json(
            { success: false, error: 'Invalid location format. Use "lat,lng"' },
            { status: 400 }
          );
        }
        places = await mapsService.getNearbyPlaces(
          { lat: nearbyCoords[0]!, lng: nearbyCoords[1]! },
          validatedRadius || 5000,
          validatedType
        );
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