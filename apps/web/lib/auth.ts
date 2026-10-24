import { jwtVerify } from 'jose';
import type { JwtPayload } from '@cheap-market/shared-types';

// Runs in both the Edge runtime (middleware) and Node (API routes, SSR),
// so it must stick to Web APIs only.

export const ACCESS_TOKEN_COOKIE = 'cm_access_token';

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  // The API signs tokens with the base64-decoded bytes of JWT_SECRET (see JwtService#getSignInKey).
  return Uint8Array.from(atob(secret), (char) => char.charCodeAt(0));
}

/**
 * Verifies an access token issued by the API.
 * @returns The token's claims, or null if the token is missing, malformed, expired or wrongly signed.
 */
export async function verifyAccessToken(
  token: string | undefined,
): Promise<JwtPayload | null> {
  if (!token) {
    return null;
  }
  const key = getSecretKey();
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256', 'HS384', 'HS512'],
    });
    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
      return null;
    }
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/** Builds the Set-Cookie header value that stores the access token until it expires. */
export function serializeAccessTokenCookie(
  token: string,
  maxAgeSeconds: number,
): string {
  const attributes = [
    `${ACCESS_TOKEN_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ];
  if (process.env.NODE_ENV === 'production') {
    attributes.push('Secure');
  }
  return attributes.join('; ');
}

export function serializeClearedAccessTokenCookie(): string {
  return serializeAccessTokenCookie('', 0);
}
