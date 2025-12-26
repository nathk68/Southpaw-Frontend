import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/whop/callback
 * Handles Whop OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || request.url;
      return NextResponse.redirect(new URL('/?error=auth_failed', frontendUrl));
    }

    console.log('🔍 Exchanging Whop authorization code for token...');

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.whop.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.WHOP_CLIENT_ID,
        client_secret: process.env.WHOP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.NEXT_PUBLIC_WHOP_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || request.url;
      return NextResponse.redirect(new URL('/?error=token_failed', frontendUrl));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info with the access token
    const userResponse = await fetch('https://api.whop.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error('User fetch failed:', await userResponse.text());
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || request.url;
      return NextResponse.redirect(new URL('/?error=user_fetch_failed', frontendUrl));
    }

    const userData = await userResponse.json();

    console.log('✅ Whop user authenticated:', userData.email);

    // Get user memberships
    const membershipsResponse = await fetch(
      `https://api.whop.com/v2/memberships?user_id=${userData.id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Utiliser le token utilisateur
        },
      }
    );

    let isPro = false;
    let isPPV = false;
    let hasAccess = false;

    if (membershipsResponse.ok) {
      const membershipsData = await membershipsResponse.json();
      const memberships = membershipsData.data || [];

      console.log(`📊 Found ${memberships.length} memberships`);

      // Vérifier les memberships actifs
      const activeMemberships = memberships.filter((m: any) =>
        m.status === 'active' || m.status === 'trialing'
      );

      console.log(`✅ Active memberships: ${activeMemberships.length}`);

      // Vérifier si l'utilisateur a Southpaw PRO
      if (process.env.NEXT_PUBLIC_SOUTHPAW_PRO_PLAN_ID) {
        isPro = activeMemberships.some((m: any) =>
          m.plan_id === process.env.NEXT_PUBLIC_SOUTHPAW_PRO_PLAN_ID
        );
      }

      // Vérifier le plan gratuit/promo
      if (!isPro && process.env.NEXT_PUBLIC_SOUTHPAW_PRO_FREE_PLAN_ID) {
        isPro = activeMemberships.some((m: any) =>
          m.plan_id === process.env.NEXT_PUBLIC_SOUTHPAW_PRO_FREE_PLAN_ID
        );
      }

      // Vérifier si l'utilisateur a PPV Pass
      if (process.env.NEXT_PUBLIC_PPV_PASS_PLAN_ID) {
        isPPV = activeMemberships.some((m: any) =>
          m.plan_id === process.env.NEXT_PUBLIC_PPV_PASS_PLAN_ID
        );
      }

      hasAccess = isPro || isPPV;

      console.log('🎫 Whop access status:', { hasAccess, isPro, isPPV });
    } else {
      console.warn('⚠️ Could not fetch memberships:', await membershipsResponse.text());
    }

    // Create session object
    const session = {
      id: userData.id,
      email: userData.email,
      username: userData.username || userData.email,
      has_access: hasAccess,
      isPro,
      isPPV,
    };

    // Redirect to home with session data in URL params (to be stored in localStorage)
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || request.url;
    const response = NextResponse.redirect(new URL('/', frontendUrl));

    // Set session cookie
    response.cookies.set('whop_session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Whop callback error:', error);
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || request.url;
    return NextResponse.redirect(new URL('/?error=callback_failed', frontendUrl));
  }
}
