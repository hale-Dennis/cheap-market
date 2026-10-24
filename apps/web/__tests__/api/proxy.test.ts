/**
 * @jest-environment node
 */
import { Readable } from 'stream';
import type { NextApiRequest, NextApiResponse } from 'next';

import handler from '../../pages/api/v1/[...path]';

interface FakeRequestOptions {
  method?: string;
  path: string[];
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string;
}

function fakeRequest({
  method = 'GET',
  path,
  query = {},
  cookies = {},
  headers = {},
  body,
}: FakeRequestOptions) {
  const stream = Readable.from(body ? [Buffer.from(body)] : []);
  return Object.assign(stream, {
    method,
    query: { ...query, path },
    cookies,
    headers,
  }) as unknown as NextApiRequest;
}

function fakeResponse() {
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
    send(body: unknown) {
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

async function call(options: FakeRequestOptions) {
  const res = fakeResponse();
  await handler(fakeRequest(options), res as unknown as NextApiResponse);
  return res;
}

describe('/api/v1/[...path] proxy', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('forwards the request with the session token as a Bearer header', async () => {
    const fetchMock = mockUpstream(201, { status: 201, data: { id: 'f-1' } });

    const res = await call({
      method: 'POST',
      path: ['admin', 'farmers'],
      cookies: { cm_access_token: 'session-token' },
      headers: { 'content-type': 'application/json' },
      body: '{"fullName":"Ama"}',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://localhost:8080/api/v1/admin/farmers');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer session-token',
      'Content-Type': 'application/json',
    });
    expect(Buffer.from(init.body).toString()).toBe('{"fullName":"Ama"}');
    expect(res.statusCode).toBe(201);
    expect(JSON.parse((res.body as Buffer).toString())).toEqual({
      status: 201,
      data: { id: 'f-1' },
    });
  });

  it('forwards query parameters and sends no body for GET', async () => {
    const fetchMock = mockUpstream(200, { status: 200, data: [] });

    await call({
      path: ['admin', 'farmers'],
      query: { page: '1', sort: ['createdAt,desc', 'fullName'] },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      'http://localhost:8080/api/v1/admin/farmers?page=1&sort=createdAt%2Cdesc&sort=fullName',
    );
    expect(init.body).toBeUndefined();
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('clears the session cookie when the API rejects the token', async () => {
    mockUpstream(401, { status: 401, message: 'Authentication is required' });

    const res = await call({
      path: ['admin', 'farmers'],
      cookies: { cm_access_token: 'expired-token' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.headers['set-cookie']).toContain('cm_access_token=;');
    expect(res.headers['set-cookie']).toContain('Max-Age=0');
  });

  it('rejects path traversal', async () => {
    const fetchMock = mockUpstream(200, {});

    const res = await call({ path: ['..', 'actuator'] });

    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 502 when the API is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));

    const res = await call({ path: ['admin', 'farmers'] });

    expect(res.statusCode).toBe(502);
  });
});
