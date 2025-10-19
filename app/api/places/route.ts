import { NextRequest, NextResponse } from 'next/server';

import { withQueryValidation } from '@/lib/middleware/validation';
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
  return withAuth(
    request,
    async (authReq, token) => {
      try {
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        
        const query = queryParams.query;
        const location = queryParams.location;
        const radius = queryParams.radius ? parseInt(queryParams.radius, 10) : undefined;
        const type = queryParams.type;
        const action = queryParams.action || 'search';
        const placeId = queryParams.placeId;

        if (!query && action !== 'details') {
          return NextResponse.json(
            { success: false, error: 'Query parameter is required' },
            { status: 400 }
          );
        }

        // For search actions, ensure we have a query
        if ((action === 'search' || !action) && !query) {
          return NextResponse.json(
            { success: false, error: 'Query parameter is required for search' },
            { status: 400 }
          );
        }

        const mapsService = new MapsService();

        if (action === 'details' && placeId) {
          const place = await mapsService.getPlaceDetails(placeId);
          
          if (!place) {
            return NextResponse.json(
              { success: false, error: 'Place not found' },
              { status: 404 }
            );
          }

          return NextResponse.json({
            success: true,
            data: place,
            message: 'Place details retrieved successfully',
          });
        }

        if (action === 'nearby' && location) {
          const coords = location.split(',').map(coord => parseFloat(coord.trim()));
          const lat = coords[0];
          const lng = coords[1];
          
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            return NextResponse.json(
              { success: false, error: 'Invalid location format. Use "lat,lng"' },
              { status: 400 }
            );
          }

          const places = await mapsService.getNearbyPlaces(
            { lat, lng },
            radius || 1000,
            type
          );

          return NextResponse.json({
            success: true,
            data: {
              places,
              searchParams: {
                location: { lat, lng },
                radius: radius || 1000,
                type,
              },
              totalResults: places.length,
            },
            message: `Found ${places.length} nearby places`,
          });
        }

        // Default: search places
        const locationObj = location ? (() => {
          const coords = location.split(',').map(coord => parseFloat(coord.trim()));
          const lat = coords[0];
          const lng = coords[1];
          return (!lat || !lng || isNaN(lat) || isNaN(lng)) ? undefined : { lat, lng };
        })() : undefined;

        const places = await mapsService.searchPlaces(
          query!,
          locationObj,
          radius,
          type
        );

        return NextResponse.json({
          success: true,
          data: {
            places,
            searchParams: {
              query,
              location: locationObj,
              radius,
              type,
            },
            totalResults: places.length,
          },
          message: `Found ${places.length} places for "${query}"`,
        });
      } catch (error) {
        console.error('Error searching places:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to search places' },
          { status: 500 }
        );
      }
    }
  );
}
