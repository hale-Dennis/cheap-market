import type { GetServerSideProps } from 'next';
import type { UserRole } from '@cheap-market/shared-types';

import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from '@/lib/auth';

export interface SessionPageProps {
  /** The signed-in user's email. */
  email: string;
}

/**
 * getServerSideProps for pages restricted to one role. Middleware already guards these
 * paths; this re-check keeps pages safe if the matcher changes, and supplies the user's email.
 */
function requireRole(
  role: UserRole,
  signInPage: string,
): GetServerSideProps<SessionPageProps> {
  return async ({ req, resolvedUrl }) => {
    const session = await verifyAccessToken(req.cookies[ACCESS_TOKEN_COOKIE]);
    if (session?.role !== role) {
      return {
        redirect: {
          destination: `${signInPage}?next=${encodeURIComponent(resolvedUrl)}`,
          permanent: false,
        },
      };
    }
    return { props: { email: session.sub } };
  };
}

export const requireAdminSession = requireRole('ADMIN', '/login');
export const requireBuyerSession = requireRole('BUYER', '/signup');
/** For the cart: returning buyers are more likely than new ones, so send visitors to sign in. */
export const requireBuyerSessionForCart = requireRole('BUYER', '/login');
