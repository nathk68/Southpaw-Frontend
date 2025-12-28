/**
 * Logger sécurisé pour l'application
 * En production, seules les erreurs critiques sont loggées
 * En développement, tous les logs sont affichés
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  /**
   * Logs informatifs (seulement en développement)
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Logs de debug (seulement en développement)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Warnings (seulement en développement)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Erreurs (toujours loggées, mais sans données sensibles en production)
   */
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    } else {
      // En production, logger seulement le message d'erreur sans les détails sensibles
      const sanitizedArgs = args.map(arg => {
        if (arg instanceof Error) {
          return {
            name: arg.name,
            message: arg.message,
            // Ne pas inclure la stack trace en production pour éviter l'information disclosure
          };
        }
        if (typeof arg === 'object') {
          return '[Object]'; // Ne pas exposer les objets complets en production
        }
        return arg;
      });
      console.error(...sanitizedArgs);
    }
  },

  /**
   * Erreurs critiques (toujours loggées avec plus de détails)
   * À utiliser pour les erreurs système graves nécessitant une intervention
   */
  critical: (...args: any[]) => {
    console.error('[CRITICAL]', ...args);
    // TODO: Envoyer à un service de monitoring (Sentry, Datadog, etc.)
  },
};
