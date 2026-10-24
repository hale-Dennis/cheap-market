import type { NextApiRequest, NextApiResponse } from 'next';
import type { RegisterRequest } from '@cheap-market/shared-types';

import {
  rejectNonPost,
  startSessionVia,
  type SessionRouteBody,
} from '@/lib/sessionRoute';

/** Registers a buyer with the API and signs them in (HttpOnly session cookie). */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SessionRouteBody>,
) {
  if (rejectNonPost(req.method, res)) return;

  const { fullName, email, password, region } = (req.body ?? {}) as Partial<RegisterRequest>;
  return startSessionVia(
    '/api/v1/auth/register',
    { fullName, email, password, region },
    res,
    'Sign-up failed. Please try again.',
  );
}
