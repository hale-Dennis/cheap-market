import type {
  LoginRequest,
  RegisterRequest,
  UserRole,
} from '@cheap-market/shared-types';

export interface LoginResult {
  role: UserRole;
}

export class AuthError extends Error {}

/** Posts to one of our session API routes, which store the session in an HttpOnly cookie. */
async function startSession(
  path: string,
  body: unknown,
  fallbackError: string,
): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('Unable to reach the server. Please try again.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AuthError(payload?.message ?? fallbackError);
  }
  return payload as LoginResult;
}

export function login(credentials: LoginRequest): Promise<LoginResult> {
  return startSession('/api/auth/login', credentials, 'Login failed. Please try again.');
}

/** Creates a buyer account and signs the new buyer in. */
export function register(request: RegisterRequest): Promise<LoginResult> {
  return startSession('/api/auth/register', request, 'Sign-up failed. Please try again.');
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}
