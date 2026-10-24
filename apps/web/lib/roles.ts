import type { UserRole } from '@cheap-market/shared-types';

import { safeRedirectPath } from '@/lib/redirect';

/** Where each role lands after signing in, and the URL prefix only that role may visit. */
const AREAS: Partial<Record<UserRole, { home: string; prefix: string }>> = {
  ADMIN: { home: '/admin', prefix: '/admin' },
  BUYER: { home: '/buyer/profile', prefix: '/buyer' },
};

export function homeForRole(role: UserRole): string {
  return AREAS[role]?.home ?? '/';
}

/** The role whose area contains `pathname`, if any. */
export function roleForPath(pathname: string): UserRole | null {
  for (const [role, area] of Object.entries(AREAS)) {
    if (pathname === area.prefix || pathname.startsWith(`${area.prefix}/`)) {
      return role as UserRole;
    }
  }
  return null;
}

/**
 * Where to send a user after sign-in or sign-up: the `?next=` path if it is a safe,
 * same-origin path they are allowed to see, otherwise their role's home page.
 */
export function destinationAfterSignIn(role: UserRole, next: unknown): string {
  const home = homeForRole(role);
  const path = safeRedirectPath(next, home);
  const requiredRole = roleForPath(path.split('?')[0]);
  return requiredRole === null || requiredRole === role ? path : home;
}
