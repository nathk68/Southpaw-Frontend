import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';

interface Session {
  id: string;
  email?: string;
  username?: string;
  has_access: boolean;
  isPro?: boolean;
  isPPV?: boolean;
  createdAt?: number;
  expiresAt?: number;
  discordAccessToken?: string;
}

/**
 * POST /api/auth/verify-roles
 * Re-vérifie les rôles Discord de l'utilisateur connecté
 * Appelé avant chaque prédiction pour s'assurer que l'utilisateur a toujours accès
 */
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('whop_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated', hasAccess: false },
        { status: 401 }
      );
    }

    const session = await verifySession(sessionCookie.value);

    if (!session) {
      console.warn('⚠️ Invalid session signature detected');
      const response = NextResponse.json(
        { error: 'Invalid session', hasAccess: false },
        { status: 401 }
      );
      response.cookies.delete('whop_session');
      return response;
    }

    // Vérifier si la session a expiré (2h)
    if (session.expiresAt && Date.now() > session.expiresAt) {
      console.log('⏰ Session expired, logging out user');

      const response = NextResponse.json(
        { error: 'Session expired', hasAccess: false, expired: true },
        { status: 401 }
      );

      response.cookies.delete('whop_session');
      return response;
    }

    // Pour l'instant, on ne peut pas re-vérifier les rôles Discord car on ne stocke pas le token
    // On retourne juste l'état actuel de la session
    // Dans une vraie implémentation, il faudrait stocker le Discord access token
    // et le refresh token pour pouvoir re-vérifier les rôles

    console.log('✅ Session still valid for user:', session.username);

    return NextResponse.json({
      hasAccess: session.has_access,
      isPro: session.isPro || false,
      isPPV: session.isPPV || false,
      username: session.username,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Verify roles error:', error);
    return NextResponse.json(
      { error: 'Verification failed', hasAccess: false },
      { status: 500 }
    );
  }
}
