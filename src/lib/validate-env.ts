/**
 * Validation des variables d'environnement critiques
 * Ce fichier doit être importé au démarrage de l'application pour détecter
 * les erreurs de configuration avant qu'elles ne causent des crashes en production
 */

interface RequiredEnvVars {
  [key: string]: {
    required: boolean;
    minLength?: number;
    pattern?: RegExp;
    description: string;
  };
}

const ENV_VARS_CONFIG: RequiredEnvVars = {
  // Variables d'authentification Discord OAuth
  DISCORD_CLIENT_ID: {
    required: true,
    minLength: 10,
    description: 'Discord OAuth Client ID',
  },
  DISCORD_CLIENT_SECRET: {
    required: true,
    minLength: 10,
    description: 'Discord OAuth Client Secret',
  },
  NEXT_PUBLIC_DISCORD_REDIRECT_URI: {
    required: true,
    pattern: /^https?:\/\/.+/,
    description: 'Discord OAuth Redirect URI',
  },

  // Variables de session
  SESSION_SECRET: {
    required: true,
    minLength: 32,
    description: 'HMAC secret for session signing (minimum 32 characters for security)',
  },

  // Variables d'URL
  NEXT_PUBLIC_FRONTEND_URL: {
    required: process.env.NODE_ENV === 'production',
    pattern: /^https?:\/\/.+/,
    description: 'Frontend URL (required in production)',
  },
  PYTHON_API_URL: {
    required: true,
    pattern: /^https?:\/\/.+/,
    description: 'Python ML API URL',
  },

  // Variables Discord (optionnelles mais recommandées)
  DISCORD_GUILD_ID: {
    required: false,
    description: 'Discord Server ID for role checking',
  },
  DISCORD_PRO_ROLE_ID: {
    required: false,
    description: 'Discord PRO role ID',
  },
  DISCORD_PPV_ROLE_ID: {
    required: false,
    description: 'Discord PPV role ID',
  },
};

interface ValidationError {
  variable: string;
  error: string;
  currentValue?: string;
}

/**
 * Valide toutes les variables d'environnement requises
 * Lance une erreur si des variables critiques sont manquantes ou invalides
 */
export function validateEnvironmentVariables(): void {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  for (const [varName, config] of Object.entries(ENV_VARS_CONFIG)) {
    const value = process.env[varName];

    // Vérifier si la variable est définie
    if (!value || value.trim() === '') {
      if (config.required) {
        errors.push({
          variable: varName,
          error: `Missing required environment variable: ${config.description}`,
        });
      } else {
        warnings.push(`Optional environment variable not set: ${varName} - ${config.description}`);
      }
      continue;
    }

    // Vérifier la longueur minimale
    if (config.minLength && value.length < config.minLength) {
      errors.push({
        variable: varName,
        error: `${varName} must be at least ${config.minLength} characters (current: ${value.length})`,
        currentValue: value.substring(0, 5) + '***', // Montrer seulement les premiers caractères
      });
    }

    // Vérifier le pattern
    if (config.pattern && !config.pattern.test(value)) {
      errors.push({
        variable: varName,
        error: `${varName} does not match expected format: ${config.description}`,
        currentValue: value.substring(0, 20) + '...', // Montrer seulement le début
      });
    }
  }

  // Validation spéciale pour NEXT_PUBLIC_FRONTEND_URL en production
  if (process.env.NODE_ENV === 'production') {
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    if (!frontendUrl) {
      errors.push({
        variable: 'NEXT_PUBLIC_FRONTEND_URL',
        error: 'NEXT_PUBLIC_FRONTEND_URL is mandatory in production to prevent security issues',
      });
    } else if (frontendUrl.includes('localhost')) {
      errors.push({
        variable: 'NEXT_PUBLIC_FRONTEND_URL',
        error: 'NEXT_PUBLIC_FRONTEND_URL cannot be localhost in production',
        currentValue: frontendUrl,
      });
    }
  }

  // Afficher les warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  // Si des erreurs critiques, les afficher et throw
  if (errors.length > 0) {
    console.error('\n❌ Environment Variable Validation Failed:\n');
    errors.forEach(({ variable, error, currentValue }) => {
      console.error(`   ❌ ${variable}: ${error}`);
      if (currentValue) {
        console.error(`      Current value: ${currentValue}`);
      }
    });
    console.error('\n💡 Fix these errors in your .env.local file or environment configuration.\n');

    throw new Error(
      `Environment validation failed: ${errors.length} critical error(s) found. Check console for details.`
    );
  }

  // Succès
  console.log('✅ Environment variables validated successfully');
}

/**
 * Valide une URL de redirection pour éviter les Open Redirects
 * @param url L'URL à valider
 * @returns true si l'URL est autorisée, false sinon
 */
export function isAllowedRedirectUrl(url: string): boolean {
  const ALLOWED_DOMAINS = [
    'southpaw.com',
    'www.southpaw.com',
    'localhost',
  ];

  try {
    const parsed = new URL(url);

    // Vérifier le domaine
    const hostname = parsed.hostname;
    if (!ALLOWED_DOMAINS.includes(hostname)) {
      console.warn(`⚠️ Redirect to unauthorized domain blocked: ${hostname}`);
      return false;
    }

    // En production, forcer HTTPS
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      console.warn(`⚠️ Non-HTTPS redirect blocked in production: ${url}`);
      return false;
    }

    // En dev, autoriser HTTP localhost
    if (hostname === 'localhost' && !['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    return true;
  } catch {
    console.warn(`⚠️ Invalid URL format blocked: ${url}`);
    return false;
  }
}
