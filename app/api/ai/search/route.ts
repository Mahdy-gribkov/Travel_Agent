import { NextRequest, NextResponse } from 'next/server';

import { withQueryValidation } from '@/lib/middleware/validation';
import { VectorService } from '@/services/ai/vector.service';
import { z } from 'zod';

const vectorService = new VectorService();

const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  location: z.string().optional(),
  type: z.enum(['itinerary', 'guide', 'review', 'attraction', 'restaurant', 'other']).optional(),
  topK: z.string().default('10'),
});

export async function GET(request: NextRequest) {
  // Skip during static generation
  if (process.env.NODE_ENV === 'production' && !request.headers.get('authorization')) {
    return NextResponse.json({ success: false, error: 'Not available during build' }, { status: 503 });
  }

  return withQueryValidation(
    searchQuerySchema,
    async (req, queryData) => {
      return withAuth(
        req,
        async (authReq, token) => {
          try {
            const { query, location, type, topK } = queryData;
            const topKNumber = parseInt(topK || '10', 10) || 10;
            
            let results;
            if (location && type) {
              // Search by location and type
              results = await vectorService.searchByType(type, query, { topK: topKNumber });
              results = results.filter(result => 
                result.metadata.location?.toLowerCase().includes(location.toLowerCase())
              );
            } else if (location) {
              // Search by location
              results = await vectorService.searchByLocation(location, { topK: topKNumber });
            } else {
              // General search
              results = await vectorService.searchSimilar(query, { 
                topK: topKNumber,
                filter: type ? { type: { $eq: type } } : undefined,
              });
            }

            return NextResponse.json({
              success: true,
              data: {
                query,
                location,
                type,
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
    }
  );
}
