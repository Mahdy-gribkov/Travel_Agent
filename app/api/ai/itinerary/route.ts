import { NextRequest, NextResponse } from 'next/server';

import { createSecureHandler, SECURITY_PRESETS } from '@/lib/security/config';
import { GeminiService } from '@/services/ai/gemini.service';
import { ItineraryService } from '@/services/itinerary.service';
import { UserService } from '@/services/user.service';
import { aiItineraryRequestSchema } from '@/lib/validations/schemas';

const geminiService = new GeminiService();
const itineraryService = new ItineraryService();
const userService = new UserService();

export const POST = createSecureHandler(
  SECURITY_PRESETS.user,
  async (request: NextRequest) => {
    try {
      const data = aiItineraryRequestSchema.parse(await request.json());
      const { destination, startDate, endDate, travelers, budget, preferences, prompt } = data;
      
      // For now, we'll use a default user ID since we don't have session-based auth
      // In a real implementation, you'd get this from the API key context
      const userId = 'default-user';
      
      // Get user preferences
      const user = await userService.getUserById(userId);
      const userPreferences = preferences || user?.preferences || {};

      // Generate itinerary using AI
      const itineraryPrompt = prompt || 
        `Create a detailed travel itinerary for ${destination} from ${startDate} to ${endDate} for ${travelers} travelers with a budget of $${budget}.`;

      const aiItinerary = await geminiService.generateItinerary(itineraryPrompt, userPreferences);

      // Save itinerary to database
      const itinerary = await itineraryService.createItinerary(userId, {
        title: aiItinerary.title,
        destination: aiItinerary.destination,
        startDate: aiItinerary.startDate,
        endDate: aiItinerary.endDate,
        travelers: aiItinerary.travelers,
        budget: aiItinerary.budget,
        preferences: userPreferences,
      });

      // Update itinerary with AI-generated data
      const updatedItinerary = await itineraryService.updateItinerary(itinerary.id, {
        days: aiItinerary.days,
        metadata: aiItinerary.metadata,
      });

      return NextResponse.json({
        success: true,
        data: updatedItinerary,
        message: 'Itinerary generated successfully',
      });
    } catch (error) {
      console.error('Error generating itinerary:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to generate itinerary' },
        { status: 500 }
      );
    }
  }
);
