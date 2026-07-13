import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingFights } from '@/lib/scraper';
import { getEventDetails } from '@/lib/eventScraper';
import { fetchWithTimeout, TIMEOUTS } from '@/lib/fetch-with-timeout';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PYTHON_API_URL = process.env.PYTHON_API_URL;
const ADMIN_SYNC_TOKEN = process.env.ADMIN_SYNC_TOKEN;

function lastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

async function getFightPrediction(fighter1Name: string, fighter2Name: string) {
  if (!PYTHON_API_URL) return null;
  try {
    const [res1, res2] = await Promise.all([
      fetchWithTimeout(`${PYTHON_API_URL}/search/fighter?name=${encodeURIComponent(fighter1Name)}`, {}, TIMEOUTS.SEARCH_FIGHTER),
      fetchWithTimeout(`${PYTHON_API_URL}/search/fighter?name=${encodeURIComponent(fighter2Name)}`, {}, TIMEOUTS.SEARCH_FIGHTER),
    ]);
    if (!res1.ok || !res2.ok) return null;
    const r1 = await res1.json();
    const r2 = await res2.json();
    if (!r1.results?.length || !r2.results?.length) return null;

    const predRes = await fetchWithTimeout(
      `${PYTHON_API_URL}/predict`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fighter1_id: r1.results[0].id, fighter2_id: r2.results[0].id }) },
      TIMEOUTS.PREDICT
    );
    if (!predRes.ok) return null;
    const pred = await predRes.json();
    return {
      prob1: Math.round(pred.fighter1_win_prob * 10) / 10,
      prob2: Math.round(pred.fighter2_win_prob * 10) / 10,
      confidence: Math.round(pred.confidence * 10) / 10,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!ADMIN_SYNC_TOKEN || token !== ADMIN_SYNC_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const upcomingEvents = await getUpcomingFights();

  // Only future events (not yet started)
  const now = new Date();
  const futureEvents = upcomingEvents.filter(e => new Date(e.dateISO) > now);

  if (futureEvents.length === 0) {
    return NextResponse.json({
      message: 'No upcoming events found — cleared stale fights',
      updated: true,
      data: { generatedAt: new Date().toISOString(), count: 0, fights: [] },
    });
  }

  const fights: object[] = [];

  // Process next 3 events, 1 main event each
  for (const event of futureEvents.slice(0, 3)) {
    const slug = event.url.replace(/^.*\/event\//, '').replace(/\?.*$/, '');
    const details = await getEventDetails(slug);
    if (!details) continue;

    const mainEvent = details.mainCard[0];
    if (!mainEvent?.fighter1 || !mainEvent?.fighter2) continue;

    const pred = await getFightPrediction(mainEvent.fighter1, mainEvent.fighter2);
    if (!pred) continue;

    fights.push({
      fighter1: lastName(mainEvent.fighter1),
      fighter2: lastName(mainEvent.fighter2),
      eventTitle: details.title || event.title,
      eventDate: event.dateISO,
      prob1: pred.prob1,
      prob2: pred.prob2,
      confidence: pred.confidence,
    });
  }

  const data = {
    generatedAt: new Date().toISOString(),
    count: fights.length,
    fights,
  };

  return NextResponse.json({
    message: `Generated ${fights.length} upcoming fight predictions`,
    updated: true,
    data,
  });
}
