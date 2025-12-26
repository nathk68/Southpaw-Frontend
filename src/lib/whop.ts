// Whop App Configuration
const WHOP_API_KEY = process.env.WHOP_API_KEY || ''; // Server-side only
const WHOP_APP_ID = process.env.NEXT_PUBLIC_WHOP_APP_ID || '';
const WHOP_COMPANY_ID = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'southpaw';

// Product IDs (these are the Discord role IDs or product IDs to check)
const SOUTHPAW_PRO_PRODUCT = process.env.NEXT_PUBLIC_SOUTHPAW_PRO_PRODUCT || 'Southpaw PRO';
const PPV_PASS_PRODUCT = process.env.NEXT_PUBLIC_PPV_PASS_PRODUCT || 'PPV Pass';

export interface WhopUser {
  id: string;
  email?: string;
  username?: string;
  has_access: boolean;
  products?: string[]; // Product/role names
}

export interface AccessLevel {
  hasAccess: boolean;
  isPro: boolean;
  isPPV: boolean;
  reason?: string;
}

/**
 * Check if a user has access to predictions based on their Whop products
 */
export function checkUserAccess(user: WhopUser | null): AccessLevel {
  if (!user) {
    return {
      hasAccess: false,
      isPro: false,
      isPPV: false,
      reason: 'not_authenticated',
    };
  }

  // Check if user has direct access flag
  if (user.has_access) {
    const hasPro = user.products?.includes(SOUTHPAW_PRO_PRODUCT) || false;
    const hasPPV = user.products?.includes(PPV_PASS_PRODUCT) || false;

    return {
      hasAccess: true,
      isPro: hasPro,
      isPPV: hasPPV,
    };
  }

  return {
    hasAccess: false,
    isPro: false,
    isPPV: false,
    reason: 'no_valid_subscription',
  };
}

/**
 * Get Whop App authentication URL
 * Users will authenticate directly through your Whop App
 */
export function getWhopAuthUrl(): string {
  // For Whop Apps, users authenticate by visiting your app on Whop
  // The app URL format is: https://whop.com/hub/{company_id}/{app_id}
  return `https://whop.com/hub/${WHOP_COMPANY_ID}/${WHOP_APP_ID}`;
}

/**
 * Verify Whop session token
 */
export async function verifyWhopToken(token: string): Promise<WhopUser | null> {
  try {
    const response = await fetch('https://api.whop.com/v5/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Check if user has access via the /me endpoint
    // Whop automatically checks if user has valid membership
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      has_access: data.valid_memberships && data.valid_memberships.length > 0,
      products: data.discord_roles || [],
    };
  } catch (error) {
    console.error('Error verifying Whop token:', error);
    return null;
  }
}

/**
 * Product links
 */
export const PRODUCT_LINKS = {
  PRO: 'https://whop.com/checkout/plan_DjGRIqi0cbxc4',
  PPV: 'https://whop.com/checkout/plan_hOMobCScuCYPM',
};
