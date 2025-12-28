/**
 * Fetch avec timeout pour éviter que les requêtes bloquent indéfiniment
 * Particulièrement important pour les appels aux API externes (Python ML API)
 */

export class FetchTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = 'FetchTimeoutError';
  }
}

/**
 * Effectue un fetch avec timeout automatique
 * @param url URL à fetch
 * @param options Options fetch standard
 * @param timeoutMs Timeout en millisecondes (défaut: 10000 = 10s)
 * @returns Response
 * @throws FetchTimeoutError si le timeout est atteint
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Si l'erreur est due à l'abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FetchTimeoutError(url, timeoutMs);
    }

    // Sinon, relancer l'erreur originale
    throw error;
  }
}

/**
 * Configuration des timeouts par type de requête
 */
export const TIMEOUTS = {
  SEARCH_FIGHTER: 5000,    // 5 secondes pour rechercher un combattant
  PREDICT: 15000,          // 15 secondes pour la prédiction ML (plus lourd)
  FIGHTER_DETAILS: 5000,   // 5 secondes pour les détails
  DEFAULT: 10000,          // 10 secondes par défaut
} as const;
