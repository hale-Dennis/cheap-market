/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { SignJWT } from 'jose';

import handler from '../../pages/api/auth/register';

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

async function call(body: unknown) {
  const res = createResponse();
  await handler({ method: 'POST', body } as NextApiRequest, res as unknown as NextApiResponse);
  return res;
}

function mockUpstream(status: number, body: unknown) {
  const fetchMock = jest.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  global.fetch = fetchMock;
  return fetchMock;
}

const REGISTRATION = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  password: 'Password123',
  region: 'ASHANTI',
};

describe('POST /api/auth/register', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('registers with the API, signs the buyer in and returns 201', async () => {
    const accessToken = await new SignJWT({ role: 'BUYER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('jane@example.com')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new Uint8Array(Buffer.from(SECRET, 'base64')));
    const fetchMock = mockUpstream(201, {
      status: 201,
      data: { accessToken, refreshToken: 'refresh' },
    });

    const res = await call({ ...REGISTRATION, confirmPassword: 'ignored', role: 'ADMIN' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/v1/auth/register');
    // Only the registration fields are forwarded.
    expect(JSON.parse(init.body)).toEqual(REGISTRATION);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ role: 'BUYER' });
    expect(res.headers['set-cookie']).toContain(`cm_access_token=${accessToken}`);
    expect(res.headers['set-cookie']).toContain('HttpOnly');
  });

  it('passes through a 409 for an existing email without signing in', async () => {
    mockUpstream(409, { status: 409, message: 'A user with this email already exists.' });

    const res = await call(REGISTRATION);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ message: 'A user with this email already exists.' });
    expect(res.headers['set-cookie']).toBeUndefined();
  });
});
