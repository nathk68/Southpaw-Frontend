import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken } from '@/lib/whop';

/**
 * POST /api/auth/whop/verify
 * Verifies a Whop token and creates a session
 *
 * When users access your app through Whop, they receive a token.
 * This endpoint verifies that token and creates a session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify the token with Whop API
    const user = await verifyWhopToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Create session
    const session = {
      id: user.id,
      email: user.email,
      username: user.username,
      has_access: user.has_access,
      products: user.products,
      token, // Store token for future API calls
    };

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      access: {
        hasAccess: user.has_access,
        isPro: user.products?.includes('Southpaw PRO') || false,
        isPPV: user.products?.includes('PPV Pass') || false,
      },
    });

    // Set session cookie
    response.cookies.set('whop_session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Whop verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
