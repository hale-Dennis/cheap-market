import type { LoginRequest, UserRole } from '@cheap-market/shared-types';

export interface LoginResult {
  role: UserRole;
}

export class AuthError extends Error {}

/** Logs in via the Next.js API route, which stores the session in an HttpOnly cookie. */
export async function login(credentials: LoginRequest): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new AuthError('Unable to reach the server. Please try again.');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AuthError(body?.message ?? 'Login failed. Please try again.');
  }
  return body as LoginResult;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}
