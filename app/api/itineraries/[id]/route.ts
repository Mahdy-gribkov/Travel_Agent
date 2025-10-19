import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withValidation } from '@/lib/middleware/validation';
import { ItineraryService } from '@/services/itinerary.service';
import { updateItinerarySchema } from '@/lib/validations/schemas';

const itineraryService = new ItineraryService();
const rateLimit = withRateLimit();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(
    request,
    async (req, token) => {
      try {
        const { id } = params;
        
        const itinerary = await itineraryService.getItineraryById(id);
        if (!itinerary) {
          return NextResponse.json(
            { success: false, error: 'Itinerary not found' },
            { status: 404 }
          );
        }

        // Users can only access their own itineraries unless they're admin
        if (token.role !== 'admin' && itinerary.userId !== token.uid) {
          return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          data: itinerary,
        });
      } catch (error) {
        console.error('Error fetching itinerary:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch itinerary' },
          { status: 500 }
        );
      }
    }
  );
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withValidation(
    updateItinerarySchema,
    async (req, data) => {
      return withAuth(
        req,
        async (authReq, token) => {
          try {
            const { id } = params;
            
            const itinerary = await itineraryService.getItineraryById(id);
            if (!itinerary) {
              return NextResponse.json(
                { success: false, error: 'Itinerary not found' },
                { status: 404 }
              );
            }

            // Users can only update their own itineraries unless they're admin
            if (token.role !== 'admin' && itinerary.userId !== token.uid) {
              return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
              );
            }

            const updatedItinerary = await itineraryService.updateItinerary(id, data);

            return NextResponse.json({
              success: true,
              data: updatedItinerary,
              message: 'Itinerary updated successfully',
            });
          } catch (error) {
            console.error('Error updating itinerary:', error);
            return NextResponse.json(
              { success: false, error: 'Failed to update itinerary' },
              { status: 500 }
            );
          }
        }
      );
    }
  );
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(
    request,
    async (req, token) => {
      try {
        const { id } = params;
        
        const itinerary = await itineraryService.getItineraryById(id);
        if (!itinerary) {
          return NextResponse.json(
            { success: false, error: 'Itinerary not found' },
            { status: 404 }
          );
        }

        // Users can only delete their own itineraries unless they're admin
        if (token.role !== 'admin' && itinerary.userId !== token.uid) {
          return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
          );
        }

        await itineraryService.deleteItinerary(id);

        return NextResponse.json({
          success: true,
          message: 'Itinerary deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting itinerary:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to delete itinerary' },
          { status: 500 }
        );
      }
    }
  );
}
