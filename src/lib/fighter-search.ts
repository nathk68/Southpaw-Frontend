/**
 * Utilitaires de recherche avancée pour les combattants UFC (TypeScript version)
 */

import { FighterStats } from './predictive-engine';

/**
 * Mapping manuel pour les noms problématiques
 * Format: "nom-utilisé-dans-event" → "slug-ufc-correct"
 */
const CUSTOM_NAME_MAPPINGS: Record<string, string> = {
  // Noms chinois/asiatiques avec ordre inversé
  'ronzhu': 'zhu-rong',
  'rong-zhu': 'zhu-rong',

  // Nouveaux combattants UFC 325
  'dom-mar-fan': 'dom-mar-fan',
  'dom-marfan': 'dom-mar-fan',
  'sebastian-szalay': 'sebastian-szalay',
  'sulangrangbo': 'sulang-rangbo',
  'sulang-rangbo': 'sulang-rangbo',
  'namsrai-batbayar': 'namsrai-batbayar',
  'batbayar-namsrai': 'namsrai-batbayar',

  // Combattants additionnels
  'lawrence-lui': 'lawrence-lui',
  'aaron-tau': 'aaron-tau',
};

/**
 * Normalise un nom pour la comparaison (enlève accents, gère Jr.)
 */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .toLowerCase()
    .trim()
    .replace(/\bjr\.?\b/g, 'jr') // Uniformiser Jr.
    .replace(/\s+/g, '-');
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calcule la similarité entre deux noms (0 à 1)
 */
function calculateSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);

  const distance = levenshteinDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);

  if (maxLen === 0) return 1;

  return 1 - (distance / maxLen);
}

/**
 * Recherche fuzzy d'un combattant avec seuil de similarité
 */
function fuzzySearchFighter(
  searchName: string,
  fighters: FighterStats[],
  threshold: number = 0.7
): FighterStats | undefined {
  let bestMatch: FighterStats | undefined = undefined;
  let bestScore = 0;

  for (const fighter of fighters) {
    const urlMatch = fighter.profile_url?.match(/\/athlete\/([^\/]+)$/);
    if (!urlMatch) continue;

    const fighterSlug = urlMatch[1];
    const score = calculateSimilarity(searchName, fighterSlug);

    if (score > bestScore && score >= threshold) {
      bestMatch = fighter;
      bestScore = score;
    }
  }

  if (bestMatch) {
    const urlMatch = bestMatch.profile_url?.match(/\/athlete\/([^\/]+)$/);
    console.log(`🔍 Fuzzy match trouvé: "${urlMatch![1]}" (${(bestScore * 100).toFixed(0)}% similaire)`);
  }

  return bestMatch;
}

/**
 * Scrape UFC.com pour trouver le slug correct d'un combattant
 */
async function searchUFCWebsite(searchName: string): Promise<string | null> {
  try {
    // Nettoyer le nom pour la recherche
    const cleanName = searchName.replace(/-/g, ' ').trim();
    const searchUrl = `https://www.ufc.com/athletes/all?filters%5B0%5D=status%3A23&search=${encodeURIComponent(cleanName)}`;

    console.log(`🌐 Recherche sur UFC.com: "${cleanName}"`);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      console.log(`❌ UFC.com returned status ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Chercher le premier lien athlete dans le HTML
    const athleteRegex = /href="\/athlete\/([a-z0-9-]+)"/gi;
    const match = athleteRegex.exec(html);

    if (match && match[1]) {
      const ufcSlug = match[1];
      console.log(`✅ Trouvé sur UFC.com: "${ufcSlug}"`);
      return ufcSlug;
    }

    console.log(`❌ Aucun combattant trouvé sur UFC.com`);
    return null;
  } catch (error) {
    console.log(`❌ Erreur lors du scraping UFC.com: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

export interface FindFighterOptions {
  enableFuzzy?: boolean;
  enableWebScraping?: boolean;
  fuzzyThreshold?: number;
  logProgress?: boolean;
}

/**
 * Recherche avancée d'un combattant avec tous les fallbacks
 */
export async function findFighterAdvanced(
  searchName: string,
  fighters: FighterStats[],
  options: FindFighterOptions = {}
): Promise<FighterStats | null> {
  const {
    enableFuzzy = true,
    enableWebScraping = true,
    fuzzyThreshold = 0.7,
    logProgress = true
  } = options;

  let normalizedSearchName = normalizeName(searchName);

  if (logProgress) {
    console.log(`\n🔍 Recherche de: "${searchName}" → normalisé: "${normalizedSearchName}"`);
    console.log(`📋 Custom mappings disponibles:`, Object.keys(CUSTOM_NAME_MAPPINGS));
  }

  // Fonction helper pour chercher par slug
  const searchBySlug = (slug: string): FighterStats | undefined => {
    return fighters.find(fighter => {
      const urlMatch = fighter.profile_url?.match(/\/athlete\/([^\/]+)$/);
      if (urlMatch) {
        return urlMatch[1].toLowerCase() === slug.toLowerCase();
      }
      return false;
    });
  };

  // Fallback 0: Mapping personnalisé (priorité absolue)
  if (logProgress) {
    console.log(`🔎 Vérification mapping pour: "${normalizedSearchName}"`);
    console.log(`   Mapping trouvé? ${CUSTOM_NAME_MAPPINGS[normalizedSearchName] ? 'OUI' : 'NON'}`);
  }

  if (CUSTOM_NAME_MAPPINGS[normalizedSearchName]) {
    const mappedName = CUSTOM_NAME_MAPPINGS[normalizedSearchName];
    if (logProgress) console.log(`📝 Custom mapping appliqué: "${normalizedSearchName}" → "${mappedName}"`);

    const found = searchBySlug(mappedName);
    if (found) {
      if (logProgress) console.log(`✅ Fallback 0 (custom mapping): trouvé "${mappedName}"`);
      return found;
    } else {
      if (logProgress) console.log(`⚠️  Mapping existe mais combattant "${mappedName}" non trouvé dans la BDD`);
    }
    // Si le mapping existe mais le combattant n'est pas dans la base, on continue avec le nom mappé
    normalizedSearchName = mappedName;
  }

  // Fallback 1: Recherche exacte
  let found = searchBySlug(normalizedSearchName);
  if (found) {
    if (logProgress) console.log(`✅ Fallback 1 (exact): trouvé`);
    return found;
  }
  if (logProgress) console.log(`❌ Fallback 1 (exact): non trouvé`);

  // Fallback 2: Inversion prénom/nom (noms asiatiques)
  if (normalizedSearchName.includes('-')) {
    const parts = normalizedSearchName.split('-');
    if (parts.length >= 2) {
      const reversed = [parts[parts.length - 1], ...parts.slice(0, -1)].join('-');
      found = searchBySlug(reversed);
      if (found) {
        if (logProgress) console.log(`✅ Fallback 2 (asian reversal): trouvé avec "${reversed}"`);
        return found;
      }
    }
  }
  if (logProgress) console.log(`❌ Fallback 2 (asian reversal): non trouvé`);

  // Fallback 3: Nom composé (ex: "ian-machado-garry" → "ian-garry")
  if (normalizedSearchName.includes('-')) {
    const parts = normalizedSearchName.split('-');
    if (parts.length >= 3) {
      const firstAndLast = `${parts[0]}-${parts[parts.length - 1]}`;
      found = searchBySlug(firstAndLast);
      if (found) {
        if (logProgress) console.log(`✅ Fallback 3 (compound name): trouvé avec "${firstAndLast}"`);
        return found;
      }
    }
  }
  if (logProgress) console.log(`❌ Fallback 3 (compound name): non trouvé`);

  // Fallback 4: Fuzzy search (similarité avec Levenshtein)
  if (enableFuzzy) {
    found = fuzzySearchFighter(normalizedSearchName, fighters, fuzzyThreshold);
    if (found) {
      if (logProgress) console.log(`✅ Fallback 4 (fuzzy search): trouvé`);
      return found;
    }
    if (logProgress) console.log(`❌ Fallback 4 (fuzzy search): non trouvé (seuil: ${fuzzyThreshold * 100}%)`);
  }

  // Fallback 5: Web scraping UFC.com (dernier recours)
  if (enableWebScraping) {
    const ufcSlug = await searchUFCWebsite(normalizedSearchName);
    if (ufcSlug) {
      found = searchBySlug(ufcSlug);
      if (found) {
        if (logProgress) console.log(`✅ Fallback 5 (UFC.com scraping): trouvé`);
        return found;
      }
    }
    if (logProgress) console.log(`❌ Fallback 5 (UFC.com scraping): non trouvé`);
  }

  // Aucun fallback n'a fonctionné
  if (logProgress) {
    console.log(`\n⚠️  Combattant "${normalizedSearchName}" introuvable après tous les fallbacks`);
    console.log(`    Suggestions: vérifier l'orthographe ou le format du nom\n`);
  }

  return null;
}
