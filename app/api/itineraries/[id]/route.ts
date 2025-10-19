import { NextRequest, NextResponse } from 'next/server';
import { ItineraryService } from '@/services/itinerary.service';
import { updateItinerarySchema } from '@/lib/validations/schemas';

const itineraryService = new ItineraryService();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    const itinerary = await itineraryService.getItineraryById(id);
    if (!itinerary) {
      return NextResponse.json(
        { success: false, error: 'Itinerary not found' },
        { status: 404 }
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const updateData = await request.json();
    
    const updateSchema = updateItinerarySchema.parse(updateData);
    
    const itinerary = await itineraryService.getItineraryById(id);
    if (!itinerary) {
      return NextResponse.json(
        { success: false, error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    const updatedItinerary = await itineraryService.updateItinerary(id, updateSchema);

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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    const itinerary = await itineraryService.getItineraryById(id);
    if (!itinerary) {
      return NextResponse.json(
        { success: false, error: 'Itinerary not found' },
        { status: 404 }
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