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

function normalizeFighterName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const WEIGHT_CLASSES = new Set([
  'Lightweight', 'Heavyweight', 'Welterweight', 'Middleweight',
  'Featherweight', 'Bantamweight', 'Flyweight', "Women's", 'Strawweight',
  'Light', 'Super',
]);
const METHOD_WORDS = new Set(['KO', 'TKO', 'Decision', 'Submission', 'DQ', 'Draw', 'NC', 'No']);

interface WikiFight {
  winner: string;
  loser: string;
  weightClass: string;
  isTitleFight: boolean;
}

async function getWikipediaFights(eventTitle: string): Promise<WikiFight[] | null> {
  try {
    const searchRes = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(eventTitle)}&limit=5&format=json&namespace=0`,
      { headers: { 'User-Agent': 'Southpaw-UFC/1.0' } },
      8000
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json() as [string, string[]];
    const ufcTitle = searchData[1].find(t => /^UFC/i.test(t));
    if (!ufcTitle) return null;

    const parseRes = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(ufcTitle)}&prop=text&format=json`,
      { headers: { 'User-Agent': 'Southpaw-UFC/1.0' } },
      10000
    );
    if (!parseRes.ok) return null;
    const parseData = await parseRes.json();
    const html = parseData?.parse?.text?.['*'];
    if (!html) return null;

    // Strip HTML and split on "def." to extract fight rows
    const clean = (html as string).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const parts = clean.split('def.');
    const fights: WikiFight[] = [];

    for (let i = 1; i < parts.length; i++) {
      const beforeWords = parts[i - 1].trim().split(/\s+/);
      const afterWords = parts[i].trim().split(/\s+/);

      // Winner: last capitalized words before "def.", skipping weight class labels
      const winnerParts: string[] = [];
      for (let j = beforeWords.length - 1; j >= 0 && winnerParts.length < 3; j--) {
        const w = beforeWords[j];
        if (/^[A-Z]/.test(w) && !WEIGHT_CLASSES.has(w)) winnerParts.unshift(w);
        else break;
      }

      // Weight class: capitalized words immediately before winner that match known classes
      const weightParts: string[] = [];
      const winnerStart = beforeWords.length - winnerParts.length;
      for (let j = winnerStart - 1; j >= 0; j--) {
        if (WEIGHT_CLASSES.has(beforeWords[j])) weightParts.unshift(beforeWords[j]);
        else break;
      }

      // Loser: first capitalized words after "def.", stopping before method keywords/digits
      const loserParts: string[] = [];
      let noteText = '';
      for (let j = 0; j < afterWords.length; j++) {
        const w = afterWords[j];
        if (loserParts.length < 3 && !METHOD_WORDS.has(w) && !/^\d/.test(w) && !/^\(/.test(w) && /^[A-Z]/.test(w)) {
          loserParts.push(w);
        } else if (loserParts.length > 0) {
          noteText = afterWords.slice(j).join(' ').toLowerCase();
          break;
        }
      }

      if (winnerParts.length > 0 && loserParts.length > 0) {
        const winner = winnerParts.join(' ');
        const loser = loserParts.join(' ');
        if (winner.length > 2 && loser.length > 2) {
          fights.push({
            winner,
            loser,
            weightClass: weightParts.join(' ') || 'Unknown',
            isTitleFight: /title|championship|interim/.test(noteText),
          });
        }
      }
    }

    return fights.length > 0 ? fights : null;
  } catch {
    return null;
  }
}

function matchWikiFighter(
  fighter1: string,
  fighter2: string,
  wikiFights: WikiFight[]
): 'fighter1' | 'fighter2' | null {
  const f1Last = normalizeFighterName(fighter1).split(' ').pop()!;
  const f2Last = normalizeFighterName(fighter2).split(' ').pop()!;

  for (const wf of wikiFights) {
    const wWinLast = normalizeFighterName(wf.winner).split(' ').pop()!;
    const wLosLast = normalizeFighterName(wf.loser).split(' ').pop()!;
    // winner matches fighter1 → fighter1 wins; winner matches fighter2 → fighter2 wins
    if (wWinLast === f1Last || wLosLast === f2Last) return 'fighter1';
    if (wWinLast === f2Last || wLosLast === f1Last) return 'fighter2';
  }
  return null;
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
  // Also index existing events by date (day precision) to catch slug-format mismatches
  const knownDates = new Set(historicalData.events.map(e => e.date.slice(0, 10)));

  // Find recent past events not yet in the historical data
  const slugParam = request.nextUrl.searchParams.get('slug');
  let eventsToProcess: { slug: string; title: string; dateISO: string }[];

  if (slugParam) {
    eventsToProcess = [{ slug: slugParam, title: slugParam, dateISO: new Date().toISOString() }];
  } else {
    const recentPast = await getRecentPastEvents(30);
    eventsToProcess = recentPast.filter(e => {
      // Skip if same slug already exists
      if (knownSlugs.has(e.slug)) return false;
      // Skip if an event on the same date (±1 day) already exists (different slug format)
      const eventDay = e.dateISO.slice(0, 10);
      const eventDate = new Date(e.dateISO);
      const prevDay = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const nextDay = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (knownDates.has(eventDay) || knownDates.has(prevDay) || knownDates.has(nextDay)) return false;
      return true;
    });
  }

  if (eventsToProcess.length === 0) {
    return NextResponse.json({ message: 'No new events to process', updated: false, data: historicalData });
  }

  const newEvents: HistoricalEvent[] = [];

  for (const { slug, title, dateISO } of eventsToProcess) {
    const details = await getEventDetails(slug);
    const ufcFights = details ? [...details.mainCard, ...details.preliminaryCard, ...details.earlyPrelims] : [];

    // Wikipedia: primary source for winners + fallback fight list if UFC.com HTML is JS-rendered
    const eventTitle = details?.title || title;
    const wikiFights = await getWikipediaFights(eventTitle);
    console.log(`Wikipedia fights for "${eventTitle}": ${wikiFights ? wikiFights.length : 'not found'}`);

    const historicalFights: HistoricalFight[] = [];

    if (ufcFights.length > 0) {
      // UFC.com has fight list — use it, overlay Wikipedia winners
      for (const fight of ufcFights) {
        const pred = await getPrediction(toSlug(fight.fighter1), toSlug(fight.fighter2));

        let actualWinner: HistoricalFight['actualWinner'] = null;
        if (wikiFights) actualWinner = matchWikiFighter(fight.fighter1, fight.fighter2, wikiFights);
        if (!actualWinner) actualWinner = fight.winner ?? null;

        const wasCorrect = pred && actualWinner && actualWinner !== 'draw' && actualWinner !== 'no-contest'
          ? pred.algorithmPrediction === actualWinner : null;

        historicalFights.push({
          fighter1: fight.fighter1,
          fighter2: fight.fighter2,
          weightClass: fight.weightClass,
          isTitleFight: fight.isTitleFight,
          prediction: pred ? { fighter1WinProbability: pred.fighter1WinProbability, fighter2WinProbability: pred.fighter2WinProbability, breakdown: {} } : null,
          algorithmPrediction: pred?.algorithmPrediction ?? null,
          actualWinner,
          wasCorrect,
        });
      }
    } else if (wikiFights) {
      // UFC.com has no fights (JS-rendered page) — use Wikipedia fights directly
      // fighter1 = winner, fighter2 = loser (actualWinner is always 'fighter1')
      for (const wf of wikiFights) {
        const pred = await getPrediction(toSlug(wf.winner), toSlug(wf.loser));
        const wasCorrect = pred ? pred.algorithmPrediction === 'fighter1' : null;

        historicalFights.push({
          fighter1: wf.winner,
          fighter2: wf.loser,
          weightClass: wf.weightClass,
          isTitleFight: wf.isTitleFight,
          prediction: pred ? { fighter1WinProbability: pred.fighter1WinProbability, fighter2WinProbability: pred.fighter2WinProbability, breakdown: {} } : null,
          algorithmPrediction: pred?.algorithmPrediction ?? null,
          actualWinner: 'fighter1',
          wasCorrect,
        });
      }
    } else {
      console.log(`Skipping ${slug}: no fight data from UFC.com or Wikipedia`);
      continue;
    }

    const decidedFights = historicalFights.filter(f => f.actualWinner && f.actualWinner !== 'draw' && f.actualWinner !== 'no-contest' && f.wasCorrect !== null);
    const correctPredictions = decidedFights.filter(f => f.wasCorrect === true).length;
    const accuracy = decidedFights.length > 0 ? Math.round((correctPredictions / decidedFights.length) * 1000) / 10 : 0;

    // Skip events where no fight outcomes could be determined (results not yet on UFC.com)
    if (decidedFights.length === 0) {
      console.log(`Skipping ${slug}: no fight outcomes detected yet`);
      continue;
    }

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
