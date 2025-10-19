import { NextRequest, NextResponse } from 'next/server';
import { IngestionService } from '@/services/ai/ingestion.service';
import { createSecureHandler, SECURITY_PRESETS } from '@/lib/security/config';

const ingestionService = new IngestionService();

export const POST = createSecureHandler(
  SECURITY_PRESETS.admin,
  async (request: NextRequest) => {
    try {
      const { action } = await request.json();
      
      if (action === 'sample-data') {
        await ingestionService.ingestSampleData();
        return NextResponse.json({
          success: true,
          message: 'Sample data ingested successfully',
        });
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    } catch (error) {
      console.error('Error ingesting data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to ingest data' },
        { status: 500 }
      );
    }
  }
);

export const GET = createSecureHandler(
  SECURITY_PRESETS.admin,
  async (request: NextRequest) => {
    try {
      const stats = await ingestionService.getIngestionStats();
      
      return NextResponse.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting ingestion stats:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get stats' },
        { status: 500 }
      );
    }
  }
);
