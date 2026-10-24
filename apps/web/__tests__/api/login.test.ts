/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { SignJWT } from 'jose';

import handler from '../../pages/api/auth/login';

const SECRET = 'dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw';

function createResponse() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, unknown>,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
    setHeader(name: string, value: unknown) {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
  };
  return res;
}

function callHandler(body: unknown, method = 'POST') {
  const req = { method, body } as NextApiRequest;
  const res = createResponse();
  return handler(req, res as unknown as NextApiResponse).then(() => res);
}

function mockUpstream(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('POST /api/auth/login', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sets an HttpOnly session cookie and returns the role on success', async () => {
    const accessToken = await new SignJWT({ role: 'ADMIN' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('admin@test.com')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new Uint8Array(Buffer.from(SECRET, 'base64')));
    mockUpstream(200, {
      status: 200,
      message: 'Login successful',
      data: { accessToken, refreshToken: 'refresh' },
    });

    const res = await callHandler({ email: 'admin@test.com', password: 'pw' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ role: 'ADMIN' });
    const cookie = res.headers['set-cookie'] as string;
    expect(cookie).toContain(`cm_access_token=${accessToken}`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toMatch(/Max-Age=3(5\d\d|600)/);
  });

  it('passes through a 401 from the API without setting a cookie', async () => {
    mockUpstream(401, { status: 401, message: 'Invalid email or password' });

    const res = await callHandler({ email: 'admin@test.com', password: 'bad' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid email or password' });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('rejects a token the frontend cannot verify', async () => {
    mockUpstream(200, {
      status: 200,
      data: { accessToken: 'forged.token.value', refreshToken: 'refresh' },
    });

    const res = await callHandler({ email: 'admin@test.com', password: 'pw' });

    expect(res.statusCode).toBe(502);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('returns 502 when the API is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));

    const res = await callHandler({ email: 'admin@test.com', password: 'pw' });

    expect(res.statusCode).toBe(502);
  });

  it('rejects non-POST requests', async () => {
    const res = await callHandler(undefined, 'GET');

    expect(res.statusCode).toBe(405);
  });
});
