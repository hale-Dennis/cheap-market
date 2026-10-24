/**
 * @jest-environment node
 */
import { SignJWT } from 'jose';

import {
  serializeAccessTokenCookie,
  verifyAccessToken,
} from '../lib/auth';
import { safeRedirectPath } from '../lib/redirect';

// Base64 of a test key (at least 32 bytes), matching how the API reads JWT_SECRET.
const SECRET = 'dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw';
const SECRET_BYTES = new Uint8Array(Buffer.from(SECRET, 'base64'));

function sign(
  claims: Record<string, unknown>,
  { key = SECRET_BYTES as Uint8Array, expiresIn = '1h' } = {},
) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin@test.com')
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

describe('verifyAccessToken', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('returns the claims of a valid token', async () => {
    const token = await sign({ role: 'ADMIN' });

    const session = await verifyAccessToken(token);

    expect(session).toMatchObject({ sub: 'admin@test.com', role: 'ADMIN' });
  });

  it('returns null when the token is missing', async () => {
    await expect(verifyAccessToken(undefined)).resolves.toBeNull();
  });

  it('returns null for a malformed token', async () => {
    await expect(verifyAccessToken('not-a-jwt')).resolves.toBeNull();
  });

  it('returns null for an expired token', async () => {
    const token = await sign({ role: 'ADMIN' }, { expiresIn: '-1m' });

    await expect(verifyAccessToken(token)).resolves.toBeNull();
  });

  it('returns null for a token signed with another key', async () => {
    const otherKey = new TextEncoder().encode('a-completely-different-secret-key!!');
    const token = await sign({ role: 'ADMIN' }, { key: otherKey });

    await expect(verifyAccessToken(token)).resolves.toBeNull();
  });

  it('returns null for a token without a role claim', async () => {
    const token = await sign({});

    await expect(verifyAccessToken(token)).resolves.toBeNull();
  });

  it('throws when JWT_SECRET is not configured', async () => {
    delete process.env.JWT_SECRET;

    await expect(verifyAccessToken('anything')).rejects.toThrow(
      'JWT_SECRET is not configured.',
    );
  });
});

describe('serializeAccessTokenCookie', () => {
  it('marks the cookie HttpOnly with SameSite=Lax and the given lifetime', () => {
    const cookie = serializeAccessTokenCookie('abc', 3600);

    expect(cookie).toContain('cm_access_token=abc');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Max-Age=3600');
    expect(cookie).toContain('Path=/');
  });
});

describe('safeRedirectPath', () => {
  it.each(['/admin', '/admin/farmers?page=2'])('accepts %s', (path) => {
    expect(safeRedirectPath(path, '/admin')).toBe(path);
  });

  it.each([
    undefined,
    ['/admin'],
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
  ])('falls back for %p', (path) => {
    expect(safeRedirectPath(path, '/admin')).toBe('/admin');
  });
});
