import type { NextApiResponse } from 'next';
import type { ApiResponse, LoginResponse } from '@cheap-market/shared-types';

import { serializeAccessTokenCookie, verifyAccessToken } from '@/lib/auth';
import type { LoginResult } from '@/services/authService';

export type SessionRouteBody = LoginResult | { message: string };

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';

/**
 * Posts `body` to an API auth endpoint that returns tokens (login, register), stores the
 * access token in an HttpOnly cookie and responds with the user's role. API errors pass through.
 * The token is never exposed to client-side JavaScript.
 */
export async function startSessionVia(
  apiPath: string,
  body: unknown,
  res: NextApiResponse<SessionRouteBody>,
  fallbackError: string,
) {
  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}${apiPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return res
      .status(502)
      .json({ message: 'Unable to reach the server. Please try again.' });
  }

  const payload = (await upstream
    .json()
    .catch(() => null)) as ApiResponse<LoginResponse> | null;

  if (!upstream.ok) {
    return res
      .status(upstream.status)
      .json({ message: payload?.message ?? fallbackError });
  }

  const accessToken = payload?.data?.accessToken;
  const session = await verifyAccessToken(accessToken);
  if (!accessToken || !session) {
    return res
      .status(502)
      .json({ message: 'Received an invalid session from the server.' });
  }

  const secondsUntilExpiry = session.exp - Math.floor(Date.now() / 1000);
  res.setHeader(
    'Set-Cookie',
    serializeAccessTokenCookie(accessToken, secondsUntilExpiry),
  );
  return res.status(upstream.status).json({ role: session.role });
}

export function rejectNonPost(method: string | undefined, res: NextApiResponse): boolean {
  if (method === 'POST') {
    return false;
  }
  res.setHeader('Allow', 'POST');
  res.status(405).json({ message: 'Method not allowed.' });
  return true;
}
