import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/whop/verify-email
 * Vérifie si un email a un membership actif Whop et crée une session
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      );
    }

    // Vérifier avec l'API Whop si cet email a des memberships
    const response = await fetch(
      `https://api.whop.com/v5/memberships?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Whop API error:', await response.text());
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la vérification avec Whop' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const memberships = data.data || [];

    // Filtrer pour ne garder que les memberships actifs pour Southpaw PRO ou PPV Pass
    const activeMemberships = memberships.filter(
      (m: any) =>
        m.status === 'active' &&
        (m.plan_id === process.env.NEXT_PUBLIC_SOUTHPAW_PRO_PLAN_ID ||
          m.plan_id === process.env.NEXT_PUBLIC_PPV_PASS_PLAN_ID)
    );

    if (activeMemberships.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucun abonnement Southpaw actif trouvé pour cet email',
      });
    }

    // Prendre le premier membership actif
    const membership = activeMemberships[0];

    // Déterminer le type d'abonnement
    const isPro = membership.plan_id === process.env.NEXT_PUBLIC_SOUTHPAW_PRO_PLAN_ID;
    const isPPV = membership.plan_id === process.env.NEXT_PUBLIC_PPV_PASS_PLAN_ID;

    // Créer la session
    const session = {
      id: membership.user_id || email, // Fallback sur email si pas de user_id
      email: email,
      username: membership.username || email.split('@')[0],
      has_access: true,
      plan_id: membership.plan_id,
      membership_id: membership.id,
    };

    const res = NextResponse.json({
      success: true,
      user: {
        id: session.id,
        email: session.email,
        username: session.username,
      },
      access: {
        hasAccess: true,
        isPro,
        isPPV,
      },
    });

    // Créer le cookie de session sécurisé
    res.cookies.set('whop_session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la vérification' },
      { status: 500 }
    );
  }
}
