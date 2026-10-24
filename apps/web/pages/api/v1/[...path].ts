import type { NextApiRequest, NextApiResponse } from 'next';

import {
  ACCESS_TOKEN_COOKIE,
  serializeClearedAccessTokenCookie,
} from '@/lib/auth';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';

// Forward request bodies untouched (JSON today, multipart image uploads later).
export const config = { api: { bodyParser: false } };

async function readBody(req: NextApiRequest): Promise<ArrayBuffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const body = Buffer.concat(chunks);
  return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
}

function buildUpstreamUrl(req: NextApiRequest): URL | null {
  const segments = ([] as string[]).concat(req.query.path ?? []);
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return null;
  }
  const url = new URL(
    `${API_BASE_URL}/api/v1/${segments.map(encodeURIComponent).join('/')}`,
  );
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    for (const item of ([] as string[]).concat(value ?? [])) {
      url.searchParams.append(key, item);
    }
  }
  return url;
}

/**
 * Proxies /api/v1/* to the backend, attaching the access token from the
 * HttpOnly session cookie as a Bearer token. The backend enforces authorisation.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = buildUpstreamUrl(req);
  if (!url) {
    return res.status(400).json({ message: 'Invalid path.' });
  }

  const token = req.cookies[ACCESS_TOKEN_COOKIE];
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const method = req.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method,
      headers,
      body: hasBody ? await readBody(req) : undefined,
      redirect: 'manual',
    });
  } catch {
    return res
      .status(502)
      .json({ message: 'Unable to reach the server. Please try again.' });
  }

  if (upstream.status === 401 && token) {
    // The backend rejected our token (expired or revoked): end the browser session too.
    res.setHeader('Set-Cookie', serializeClearedAccessTokenCookie());
  }
  const contentType = upstream.headers.get('content-type');
  if (contentType) {
    res.setHeader('Content-Type', contentType);
  }
  res.status(upstream.status);
  return res.send(Buffer.from(await upstream.arrayBuffer()));
}
