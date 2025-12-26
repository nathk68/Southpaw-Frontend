import { NextResponse } from 'next/server';
import { getUpcomingFights } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events - Returns upcoming UFC events
 * Cached for 1 hour to avoid excessive scraping
 */
export async function GET() {
  try {
    const events = await getUpcomingFights();

    if (!events.length) {
      return NextResponse.json(
        {
          error: 'Impossible de récupérer les événements UFC pour le moment.',
          updatedAt: new Date().toISOString(),
          count: 0,
          data: []
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la récupération des événements.',
        updatedAt: new Date().toISOString(),
        count: 0,
        data: []
      },
      { status: 500 }
    );
  }
}
