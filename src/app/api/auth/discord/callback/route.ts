import { NextRequest, NextResponse } from 'next/server';
import { signSession } from '@/lib/session';

/**
 * GET /api/auth/discord/callback
 * Gère le callback Discord OAuth
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || request.url;
      return NextResponse.redirect(new URL('/?error=discord_auth_failed', frontendUrl));
    }

    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Discord token exchange failed:', await tokenResponse.text());
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || request.url;
      return NextResponse.redirect(new URL('/?error=discord_token_failed', frontendUrl));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Récupérer les informations de l'utilisateur Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Discord user fetch failed:', await userResponse.text());
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || request.url;
      return NextResponse.redirect(new URL('/?error=discord_user_failed', frontendUrl));
    }

    const discordUser = await userResponse.json();

    // Maintenant, vérifier avec Whop si cet email a un membership
    const email = discordUser.email;

    if (!email) {
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || request.url;
      return NextResponse.redirect(
        new URL('/?error=discord_no_email', frontendUrl)
      );
    }

    // Vérifier les rôles Discord sur le serveur Southpaw
    console.log('🔍 Checking Discord roles for user:', discordUser.username);

    let hasAccess = false;
    let isPro = false;
    let isPPV = false;

    // Récupérer les rôles de l'utilisateur sur le serveur Discord
    const guildId = process.env.DISCORD_GUILD_ID; // ID du serveur Southpaw
    const proRoleId = process.env.DISCORD_PRO_ROLE_ID; // ID du rôle Southpaw PRO
    const ppvRoleId = process.env.DISCORD_PPV_ROLE_ID; // ID du rôle PPV Pass

    if (guildId) {
      try {
        console.log(`🎮 Checking roles on guild ${guildId}...`);

        const memberResponse = await fetch(
          `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (memberResponse.ok) {
          const memberData = await memberResponse.json();
          const userRoles = memberData.roles || [];

          console.log(`👤 User roles on server:`, userRoles);
          console.log(`🔍 Looking for roles:`, { PRO: proRoleId, PPV: ppvRoleId });

          // Vérifier si l'utilisateur a le rôle PRO
          if (proRoleId && userRoles.includes(proRoleId)) {
            console.log('✅ User has Southpaw PRO role!');
            isPro = true;
            hasAccess = true;
          }

          // Vérifier si l'utilisateur a le rôle PPV
          if (ppvRoleId && userRoles.includes(ppvRoleId)) {
            console.log('✅ User has PPV Pass role!');
            isPPV = true;
            hasAccess = true;
          }

          if (hasAccess) {
            console.log('🎫 Access granted via Discord roles:', { isPro, isPPV });
          } else {
            console.log('⚠️ User does not have required Discord roles');
          }
        } else {
          console.warn('⚠️ Could not fetch guild member data:', memberResponse.status);
          console.warn('User may not be in the Discord server');
        }
      } catch (error) {
        console.error('❌ Error checking Discord roles:', error);
      }
    } else {
      console.warn('⚠️ DISCORD_GUILD_ID not set, skipping role check');
    }

    // Note: L'authentification se fait uniquement via les rôles Discord maintenant
    // Pour Whop, on utilisera Whop OAuth (à implémenter séparément)

    // Créer la session avec timestamp pour expiration
    const session = {
      id: discordUser.id,
      email: email,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar,
      has_access: hasAccess,
      isPro,
      isPPV,
      createdAt: Date.now(), // Pour vérifier l'expiration côté serveur
      expiresAt: Date.now() + (2 * 60 * 60 * 1000), // 2 heures
    };

    // Whitelist des URLs de redirection autorisées
    const ALLOWED_REDIRECT_URLS = [
      process.env.NEXT_PUBLIC_FRONTEND_URL,
      'http://localhost:3000',
      'https://localhost:3000',
    ].filter(Boolean);

    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;

    if (!frontendUrl || !ALLOWED_REDIRECT_URLS.includes(frontendUrl)) {
      return NextResponse.json(
        { error: 'Invalid redirect URL configuration' },
        { status: 500 }
      );
    }

    const response = NextResponse.redirect(new URL('/', frontendUrl));

    // Créer le cookie de session signé - expire dans 2h
    const signedSession = await signSession(session);
    response.cookies.set('whop_session', signedSession, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 2 * 60 * 60, // 2 heures (en secondes)
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Discord OAuth callback error:', error);
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL('/?error=discord_callback_failed', frontendUrl));
  }
}
