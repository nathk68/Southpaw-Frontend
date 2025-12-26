import { NextResponse } from 'next/server';

/**
 * GET /api/auth/whop
 * Initie le flux OAuth Whop
 */
export async function GET() {
  const clientId = process.env.WHOP_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_WHOP_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Whop OAuth not configured' },
      { status: 500 }
    );
  }

  // Construire l'URL d'autorisation Whop
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'user:read memberships:read',
  });

  const authUrl = `https://whop.com/oauth?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
