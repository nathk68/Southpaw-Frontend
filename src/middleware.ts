import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';
import { verifySession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Rate Limiting sur les endpoints API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { allowed, remaining, resetTime } = rateLimiter.check(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          },
        }
      );
    }

    // Ajouter les headers de rate limit aux réponses réussies
    response.headers.set('X-RateLimit-Limit', '10');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
  }

  // 2. Protection CSRF pour les méthodes modifiantes
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    // Vérifier que la requête vient du même site
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: 'CSRF protection: Origin mismatch' },
          { status: 403 }
        );
      }
    }

    // Vérifier le token CSRF pour les routes API
    // Exemptions: routes d'auth et routes déjà protégées par authentification
    const csrfExemptRoutes = [
      { path: '/api/auth/session', method: 'DELETE' },      // Logout
      { path: '/api/auth/verify-roles', method: 'POST' },   // Vérification de session
      { path: '/api/predict', method: 'POST' },             // Prédictions (déjà protégé par auth)
    ];

    const isExemptRoute = csrfExemptRoutes.some(
      route => request.nextUrl.pathname === route.path && request.method === route.method
    );

    if (request.nextUrl.pathname.startsWith('/api/') && !isExemptRoute) {
      const csrfToken = request.headers.get('x-csrf-token');
      const csrfCookie = request.cookies.get('csrf_token');

      if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie.value) {
        return NextResponse.json(
          { error: 'CSRF token invalid or missing' },
          { status: 403 }
        );
      }
    }
  }

  // 3. Protection des routes sensibles (Discord uniquement)
  // Note: /fight-card et /stats sont publiques, seul /predict nécessite une connexion
  const protectedPaths = ['/predict'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const session = request.cookies.get('whop_session');

    if (!session) {
      const url = new URL('/', request.url);
      url.searchParams.set('auth', 'required');
      return NextResponse.redirect(url);
    }

    // Vérifier la signature de la session pour éviter la forgery
    const sessionData = await verifySession(session.value);

    if (!sessionData) {
      console.warn('⚠️ Invalid session signature detected in middleware');
      const url = new URL('/', request.url);
      url.searchParams.set('session', 'invalid');
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.cookies.delete('whop_session');
      return redirectResponse;
    }

    // Vérifier l'expiration de la session
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
      console.log('⏰ Session expired in middleware');
      const url = new URL('/', request.url);
      url.searchParams.set('session', 'expired');
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.cookies.delete('whop_session');
      return redirectResponse;
    }

    if (!sessionData.has_access) {
      const url = new URL('/', request.url);
      url.searchParams.set('access', 'denied');
      return NextResponse.redirect(url);
    }
  }

  // 4. Générer un token CSRF pour les requêtes GET et l'ajouter en cookie
  if (request.method === 'GET' && !request.cookies.get('csrf_token')) {
    const csrfToken = crypto.randomUUID();
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 heures
    });
  }

  // 5. Ajouter des headers de sécurité supplémentaires
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
