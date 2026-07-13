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
 * @param nextEventSlugs - Slugs of the next 3 upcoming events (PPV Pass access window)
 * @returns EventAccessResult indicating if user can access and why/why not
 */
export function canAccessEvent(
  access: AccessLevel | null,
  eventSlug: string,
  nextEventSlugs: string | string[] | null
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

  // PPV Pass users can only access the next 3 upcoming events
  if (access.isPPV) {
    const slugs = Array.isArray(nextEventSlugs)
      ? nextEventSlugs
      : [nextEventSlugs].filter((s): s is string => Boolean(s));
    const isUpcomingEvent = slugs.includes(eventSlug);

    if (isUpcomingEvent) {
      return { canAccess: true, isNextEvent: true };
    } else {
      return { canAccess: false, reason: 'ppv_restricted', isNextEvent: false };
    }
  }

  // Si l'utilisateur a hasAccess=true, on lui donne l'accès même sans isPro/isPPV explicite
  // Cela couvre le cas où Discord donne l'accès mais les flags ne sont pas correctement définis
  if (access.hasAccess) {
    return {
      canAccess: true,
    };
  }

  // User has no access
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
