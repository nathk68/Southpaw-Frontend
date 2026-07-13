import { NextResponse } from 'next/server';
import { getUpcomingFights } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/next - Returns the next upcoming UFC event
 */
export async function GET() {
  try {
    const events = await getUpcomingFights();

    if (!events.length) {
      return NextResponse.json(
        {
          error: 'Aucun événement à venir trouvé.',
          data: null
        },
        { status: 404 }
      );
    }

    // Sort events by date (earliest first)
    const sortedEvents = events.sort((a, b) =>
      new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime()
    );

    // Return the next event + slugs of the next 3 for PPV access control
    const nextSlugs = sortedEvents.slice(0, 3)
      .map(e => e.url.split('/').pop()?.split('?')[0] || '')
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: sortedEvents[0],
      nextSlugs,
    });
  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la récupération du prochain événement.',
        data: null
      },
      { status: 500 }
    );
  }
}
