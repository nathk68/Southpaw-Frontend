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
}

/**
 * GET /api/auth/session
 * Returns the current user session (Discord login only)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('whop_session');

    if (!sessionCookie) {
      return NextResponse.json({ user: null, access: null });
    }

    const session = await verifySession(sessionCookie.value);

    if (!session) {
      console.warn('⚠️ Invalid session signature detected');
      const response = NextResponse.json({ user: null, access: null });
      response.cookies.delete('whop_session');
      return response;
    }

    // Vérifier si la session a expiré (2h pour Discord)
    if (session.expiresAt && Date.now() > session.expiresAt) {
      console.log('⏰ Session expired during fetch');

      const response = NextResponse.json({ user: null, access: null, expired: true });
      response.cookies.delete('whop_session');
      return response;
    }

    // Retourner la session avec les infos d'accès
    return NextResponse.json({
      user: {
        id: session.id,
        email: session.email,
        username: session.username,
      },
      access: {
        hasAccess: session.has_access,
        isPro: session.isPro || false,
        isPPV: session.isPPV || false,
        reason: session.has_access ? undefined : 'no_valid_subscription',
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ user: null, access: null });
  }
}

/**
 * DELETE /api/auth/session
 * Logs out the user
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('whop_session');
  return response;
}
