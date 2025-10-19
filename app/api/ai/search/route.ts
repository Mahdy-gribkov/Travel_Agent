import { NextRequest, NextResponse } from 'next/server';

import { createSecureHandler, SECURITY_PRESETS } from '@/lib/security/config';
import { VectorService } from '@/services/ai/vector.service';
import { z } from 'zod';

const vectorService = new VectorService();

const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  location: z.string().optional(),
  type: z.enum(['itinerary', 'guide', 'review', 'attraction', 'restaurant', 'other']).optional(),
  topK: z.string().default('10'),
});

export const GET = createSecureHandler(
  SECURITY_PRESETS.search,
  async (request: NextRequest) => {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get('query');
      const location = url.searchParams.get('location');
      const type = url.searchParams.get('type') as any;
      const topK = url.searchParams.get('topK');

      // Validate query parameters
      const queryData = searchQuerySchema.parse({
        query,
        location,
        type,
        topK,
      });

      const { query: validatedQuery, location: validatedLocation, type: validatedType, topK: validatedTopK } = queryData;
      const topKNumber = parseInt(validatedTopK || '10', 10) || 10;
      
      let results;
      if (validatedLocation && validatedType) {
        // Search by location and type
        results = await vectorService.searchByType(validatedType, validatedQuery, { topK: topKNumber });
        results = results.filter(result => 
          result.metadata.location?.toLowerCase().includes(validatedLocation.toLowerCase())
        );
      } else if (validatedLocation) {
        // Search by location
        results = await vectorService.searchByLocation(validatedLocation, { topK: topKNumber });
      } else {
        // General search
        results = await vectorService.searchSimilar(validatedQuery, { 
          topK: topKNumber,
          filter: validatedType ? { type: { $eq: validatedType } } : undefined,
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          query: validatedQuery,
          location: validatedLocation,
          type: validatedType,
          results: results.map(result => ({
            id: result.id,
            title: result.metadata.title,
            content: result.content.substring(0, 200) + '...',
            type: result.metadata.type,
            location: result.metadata.location,
            tags: result.metadata.tags,
            score: result.metadata.relevance || 0.9,
          })),
          total: results.length,
        },
        message: 'Search completed successfully',
      });
    } catch (error) {
      console.error('Error searching:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to search' },
        { status: 500 }
      );
    }
  }
);
