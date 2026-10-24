import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
} from '@cheap-market/shared-types';

import { serializeAccessTokenCookie, verifyAccessToken } from '@/lib/auth';
import type { LoginResult } from '@/services/authService';

type ErrorBody = { message: string };

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';

/**
 * Exchanges credentials for an access token with the API and stores it in an
 * HttpOnly cookie, so the token is never exposed to client-side JavaScript.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResult | ErrorBody>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const { email, password } = (req.body ?? {}) as Partial<LoginRequest>;

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return res
      .status(502)
      .json({ message: 'Unable to reach the server. Please try again.' });
  }

  const body = (await upstream
    .json()
    .catch(() => null)) as ApiResponse<LoginResponse> | null;

  if (!upstream.ok) {
    return res
      .status(upstream.status)
      .json({ message: body?.message ?? 'Login failed. Please try again.' });
  }

  const accessToken = body?.data?.accessToken;
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
  return res.status(200).json({ role: session.role });
}
