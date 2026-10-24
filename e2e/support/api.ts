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
export function seedFarmer(fullName: string, region = 'VOLTA') {
  return stubRequest<{ id: string; fullName: string }>('/api/v1/admin/farmers', {
    method: 'POST',
    body: JSON.stringify({
      fullName,
      phoneNumber: `020${String(randomInt(0, 10_000_000)).padStart(7, '0')}`,
      region,
    }),
  });
}

/** Creates an active listing directly in the stub API and returns it. */
export function seedListing(listing: {
  farmerId: string;
  categoryId: string;
  name: string;
  priceCents?: number;
  description?: string;
  imageUrls?: string[];
}) {
  return stubRequest<{ id: string; name: string }>('/api/v1/admin/products', {
    method: 'POST',
    body: JSON.stringify({
      priceCents: 1500,
      unit: 'per kg',
      harvestDate: new Date().toLocaleDateString('en-CA'),
      imageUrls: [`/api/v1/media/${randomUUID()}.jpg`],
      ...listing,
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

/** Creates a pickup location directly in the stub API and returns it. */
export function seedPickupLocation(name: string, region: string) {
  return stubRequest<{ id: string; name: string }>('/api/v1/admin/pickup-locations', {
    method: 'POST',
    body: JSON.stringify({
      name,
      region,
      address: { street: `${name} Road`, town: 'Cape Coast', gpsAddress: null },
      operatingHours: 'Mon–Sat 7am–6pm',
    }),
  });
}

/** Sets an order's status as an admin would (PATCH /admin/orders/{id}/status). */
export function setOrderStatus(orderId: string, status: string) {
  return stubRequest(`/api/v1/admin/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
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
