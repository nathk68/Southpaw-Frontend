import { AccessLevel } from './whop';

export interface EventAccessResult {
  canAccess: boolean;
  reason?: 'not_authenticated' | 'ppv_restricted' | 'no_subscription';
  isNextEvent?: boolean;
}

/**
 * Check if a user can access a specific event based on their subscription level
 *
 * @param access - User's access level from auth context
 * @param eventSlug - The event slug to check access for
 * @param nextEventSlug - The slug of the next upcoming event
 * @returns EventAccessResult indicating if user can access and why/why not
 */
export function canAccessEvent(
  access: AccessLevel | null,
  eventSlug: string,
  nextEventSlug: string | null
): EventAccessResult {
  // Not authenticated
  if (!access || !access.hasAccess) {
    return {
      canAccess: false,
      reason: 'not_authenticated',
    };
  }

  // Southpaw PRO users can access all events
  if (access.isPro) {
    return {
      canAccess: true,
    };
  }

  // PPV Pass users can only access the next event
  if (access.isPPV) {
    const isNextEvent = eventSlug === nextEventSlug;

    if (isNextEvent) {
      return {
        canAccess: true,
        isNextEvent: true,
      };
    } else {
      return {
        canAccess: false,
        reason: 'ppv_restricted',
        isNextEvent: false,
      };
    }
  }

  // User has access flag but no recognized subscription
  return {
    canAccess: false,
    reason: 'no_subscription',
  };
}

/**
 * Extract event slug from URL
 */
export function extractEventSlug(url: string): string {
  const match = url.match(/\/event\/([^/?]+)/);
  return match ? match[1] : '';
}
