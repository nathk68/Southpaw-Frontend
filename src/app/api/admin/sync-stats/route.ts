import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getRecentPastEvents } from '@/lib/scraper';
import { getEventDetails } from '@/lib/eventScraper';
import { fetchWithTimeout, TIMEOUTS } from '@/lib/fetch-with-timeout';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PYTHON_API_URL = process.env.PYTHON_API_URL;
const ADMIN_SYNC_TOKEN = process.env.ADMIN_SYNC_TOKEN;

interface HistoricalFight {
  fighter1: string;
  fighter2: string;
  weightClass: string;
  isTitleFight: boolean;
  prediction: {
    fighter1WinProbability: number;
    fighter2WinProbability: number;
    breakdown: Record<string, number>;
  } | null;
  algorithmPrediction: 'fighter1' | 'fighter2' | null;
  actualWinner: 'fighter1' | 'fighter2' | 'draw' | 'no-contest' | 'cancelled' | null;
  wasCorrect: boolean | null;
}

interface HistoricalEvent {
  slug: string;
  title: string;
  date: string;
  location: string;
  accuracy: number;
  correctPredictions: number;
  totalDecidedFights: number;
  totalFights: number;
  fights: HistoricalFight[];
}

interface HistoricalData {
  metadata: {
    globalAccuracy: number;
    totalTestFights: number;
    correctPredictions: number;
    displayedEvents: number;
    trainingFights: number;
    generatedAt: string;
  };
  events: HistoricalEvent[];
}

async function getPrediction(fighter1Slug: string, fighter2Slug: string) {
  if (!PYTHON_API_URL) return null;
  try {
    const [res1, res2] = await Promise.all([
      fetchWithTimeout(`${PYTHON_API_URL}/search/fighter?name=${encodeURIComponent(fighter1Slug)}`, {}, TIMEOUTS.SEARCH_FIGHTER),
      fetchWithTimeout(`${PYTHON_API_URL}/search/fighter?name=${encodeURIComponent(fighter2Slug)}`, {}, TIMEOUTS.SEARCH_FIGHTER),
    ]);
    if (!res1.ok || !res2.ok) return null;
    const r1 = await res1.json();
    const r2 = await res2.json();
    if (!r1.results?.length || !r2.results?.length) return null;

    const f1 = r1.results[0];
    const f2 = r2.results[0];

    const predRes = await fetchWithTimeout(
      `${PYTHON_API_URL}/predict`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fighter1_id: f1.id, fighter2_id: f2.id }) },
      TIMEOUTS.PREDICT
    );
    if (!predRes.ok) return null;
    const pred = await predRes.json();
    return {
      fighter1WinProbability: pred.fighter1_win_prob,
      fighter2WinProbability: pred.fighter2_win_prob,
      algorithmPrediction: pred.prediction === 'fighter1' ? 'fighter1' : 'fighter2' as 'fighter1' | 'fighter2',
    };
  } catch {
    return null;
  }
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function GET(request: NextRequest) {
  // Auth check
  const token = request.nextUrl.searchParams.get('token');
  if (!ADMIN_SYNC_TOKEN || token !== ADMIN_SYNC_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Read current historical data
  const historicalPath = path.join(process.cwd(), 'public', 'historical-predictions.json');
  let historicalData: HistoricalData;
  try {
    historicalData = JSON.parse(fs.readFileSync(historicalPath, 'utf-8'));
  } catch {
    return NextResponse.json({ error: 'Could not read historical-predictions.json' }, { status: 500 });
  }

  const knownSlugs = new Set(historicalData.events.map(e => e.slug));

  // Find recent past events not yet in the historical data
  const slugParam = request.nextUrl.searchParams.get('slug');
  let eventsToProcess: { slug: string; title: string; dateISO: string }[];

  if (slugParam) {
    eventsToProcess = [{ slug: slugParam, title: slugParam, dateISO: new Date().toISOString() }];
  } else {
    const recentPast = await getRecentPastEvents(30);
    eventsToProcess = recentPast.filter(e => !knownSlugs.has(e.slug));
  }

  if (eventsToProcess.length === 0) {
    return NextResponse.json({ message: 'No new events to process', updated: false, data: historicalData });
  }

  const newEvents: HistoricalEvent[] = [];

  for (const { slug, title, dateISO } of eventsToProcess) {
    const details = await getEventDetails(slug);
    if (!details) continue;

    const allFights = [...details.mainCard, ...details.preliminaryCard, ...details.earlyPrelims];
    const historicalFights: HistoricalFight[] = [];

    for (const fight of allFights) {
      const pred = await getPrediction(toSlug(fight.fighter1), toSlug(fight.fighter2));

      const actualWinner = fight.winner ?? null;
      const wasCorrect = pred && actualWinner && actualWinner !== 'draw' && actualWinner !== 'no-contest'
        ? pred.algorithmPrediction === actualWinner
        : null;

      historicalFights.push({
        fighter1: fight.fighter1,
        fighter2: fight.fighter2,
        weightClass: fight.weightClass,
        isTitleFight: fight.isTitleFight,
        prediction: pred ? {
          fighter1WinProbability: pred.fighter1WinProbability,
          fighter2WinProbability: pred.fighter2WinProbability,
          breakdown: {},
        } : null,
        algorithmPrediction: pred?.algorithmPrediction ?? null,
        actualWinner,
        wasCorrect,
      });
    }

    const decidedFights = historicalFights.filter(f => f.actualWinner && f.actualWinner !== 'draw' && f.actualWinner !== 'no-contest' && f.wasCorrect !== null);
    const correctPredictions = decidedFights.filter(f => f.wasCorrect === true).length;
    const accuracy = decidedFights.length > 0 ? Math.round((correctPredictions / decidedFights.length) * 1000) / 10 : 0;

    newEvents.push({
      slug,
      title: details.title || title,
      date: dateISO,
      location: details.location || '',
      accuracy,
      correctPredictions,
      totalDecidedFights: decidedFights.length,
      totalFights: historicalFights.length,
      fights: historicalFights,
    });
  }

  if (newEvents.length === 0) {
    return NextResponse.json({ message: 'Events found but could not scrape details', updated: false, data: historicalData });
  }

  // Merge new events at the beginning (most recent first)
  const updatedEvents = [...newEvents, ...historicalData.events];

  // Recalculate global accuracy
  let totalCorrect = 0;
  let totalDecided = 0;
  for (const event of updatedEvents) {
    totalCorrect += event.correctPredictions;
    totalDecided += event.totalDecidedFights;
  }
  const globalAccuracy = totalDecided > 0 ? Math.round((totalCorrect / totalDecided) * 1000) / 10 : 0;

  const updatedData: HistoricalData = {
    metadata: {
      ...historicalData.metadata,
      globalAccuracy,
      totalTestFights: totalDecided,
      correctPredictions: totalCorrect,
      displayedEvents: updatedEvents.length,
      generatedAt: new Date().toISOString(),
    },
    events: updatedEvents,
  };

  return NextResponse.json({
    message: `Processed ${newEvents.length} new event(s)`,
    updated: true,
    newEvents: newEvents.map(e => e.slug),
    data: updatedData,
  });
}
