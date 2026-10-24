import type { NextApiRequest, NextApiResponse } from 'next';
import type { LoginRequest } from '@cheap-market/shared-types';

import {
  rejectNonPost,
  startSessionVia,
  type SessionRouteBody,
} from '@/lib/sessionRoute';

/** Signs in with the API and stores the session in an HttpOnly cookie. */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SessionRouteBody>,
) {
  if (rejectNonPost(req.method, res)) return;

  const { email, password } = (req.body ?? {}) as Partial<LoginRequest>;
  return startSessionVia(
    '/api/v1/auth/login',
    { email, password },
    res,
    'Login failed. Please try again.',
  );
}
