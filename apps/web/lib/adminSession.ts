import type { GetServerSideProps } from 'next';

import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from '@/lib/auth';

export interface AdminPageProps {
  adminEmail: string;
}

/**
 * getServerSideProps for admin pages. Middleware already guards /admin;
 * this re-check keeps pages safe if the matcher changes, and supplies the admin's email.
 */
export const requireAdminSession: GetServerSideProps<AdminPageProps> = async ({
  req,
  resolvedUrl,
}) => {
  const session = await verifyAccessToken(req.cookies[ACCESS_TOKEN_COOKIE]);
  if (session?.role !== 'ADMIN') {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(resolvedUrl)}`,
        permanent: false,
      },
    };
  }
  return { props: { adminEmail: session.sub } };
};
