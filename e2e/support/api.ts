import { randomInt, randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';

import { ADMIN, E2E_JWT_SECRET, STUB_API_PORT } from './config';

const STUB_API_URL = `http://localhost:${STUB_API_PORT}`;

function adminToken() {
  return new SignJWT({ role: 'ADMIN' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(ADMIN.email)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(new Uint8Array(Buffer.from(E2E_JWT_SECRET, 'base64')));
}

async function stubRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await adminToken();
  const response = await fetch(`${STUB_API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
  });
  if (!response.ok) {
    throw new Error(`Stub request ${path} failed: ${response.status}`);
  }
  return (await response.json()).data as T;
}

/** Creates a farmer directly in the stub API and returns it. */
export function seedFarmer(fullName: string) {
  return stubRequest<{ id: string; fullName: string }>('/api/v1/admin/farmers', {
    method: 'POST',
    body: JSON.stringify({
      fullName,
      phoneNumber: `020${String(randomInt(0, 10_000_000)).padStart(7, '0')}`,
      region: 'VOLTA',
    }),
  });
}

/** Creates a category directly in the stub API and returns it. */
export function seedCategory(name: string) {
  return stubRequest<{ id: string; name: string }>('/api/v1/admin/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/** Every listing the stub API has saved. */
export async function listProducts() {
  const { content } = await stubRequest<{ content: Array<Record<string, unknown>> }>('/api/v1/admin/products');
  return content;
}

/** Creates farmers directly in the stub API (bypassing the UI) and returns their names, oldest first. */
export async function seedFarmers(count: number): Promise<string[]> {
  const token = await adminToken();
  const batch = randomUUID().slice(0, 6);
  const names: string[] = [];
  for (let i = 1; i <= count; i++) {
    const fullName = `Seeded ${batch} ${String(i).padStart(2, '0')}`;
    const response = await fetch(`${STUB_API_URL}/api/v1/admin/farmers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fullName,
        phoneNumber: `020${String(randomInt(0, 10_000_000)).padStart(7, '0')}`,
        region: 'ASHANTI',
      }),
    });
    if (!response.ok) {
      throw new Error(`Seeding farmer failed: ${response.status}`);
    }
    names.push(fullName);
  }
  return names;
}
