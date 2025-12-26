import { NextRequest, NextResponse } from 'next/server';
import { getEventDetails } from '@/lib/eventScraper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/event?slug=ufc-324
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Event slug is required' },
        { status: 400 }
      );
    }

    const eventDetails = await getEventDetails(slug);

    if (!eventDetails) {
      return NextResponse.json(
        { error: 'Impossible de récupérer les détails de l\'événement' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: eventDetails
    });
  } catch (error) {
    console.error('Event API Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
