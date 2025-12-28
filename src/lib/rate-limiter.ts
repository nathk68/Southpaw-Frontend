/**
 * Rate Limiter en mémoire simple
 * Limite le nombre de requêtes par IP sur une fenêtre de temps donnée
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 10000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Nettoyer les anciennes entrées toutes les minutes
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Vérifie si une IP peut faire une requête
   * @param ip - L'adresse IP du client
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  check(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.records.get(ip);

    // Pas d'enregistrement ou fenêtre expirée
    if (!record || now > record.resetTime) {
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.records.set(ip, newRecord);

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: newRecord.resetTime,
      };
    }

    // Limite atteinte
    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    // Incrémenter le compteur
    record.count++;
    this.records.set(ip, record);

    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  /**
   * Nettoie les enregistrements expirés
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [ip, record] of this.records.entries()) {
      if (now > record.resetTime) {
        this.records.delete(ip);
      }
    }
  }

  /**
   * Réinitialise le rate limiter (utile pour les tests)
   */
  reset(): void {
    this.records.clear();
  }
}

// Instance singleton du rate limiter
// 10 requêtes par 10 secondes par défaut
export const rateLimiter = new InMemoryRateLimiter(10, 10000);
