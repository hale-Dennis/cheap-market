import { expect, test } from '@playwright/test';
import { SignJWT } from 'jose';

import { ADMIN, BASE_URL, BUYER, E2E_JWT_SECRET } from './support/config';
import { signIn } from './support/session';

async function signToken(role: string, key: Uint8Array) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(ADMIN.email)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
}

test.describe('Admin authentication', () => {
  test('redirects unauthenticated visitors from /admin to /login', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL('/login?next=%2Fadmin');
    await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  });

  test('admin signs in, lands on the dashboard and holds an HttpOnly session cookie', async ({
    page,
    context,
  }) => {
    await page.goto('/login');
    await signIn(page, ADMIN);

    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(page.getByText(`Signed in as ${ADMIN.email}`)).toBeVisible();

    const cookie = (await context.cookies()).find((c) => c.name === 'cm_access_token');
    expect(cookie).toBeDefined();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('Lax');
    expect(await page.evaluate(() => document.cookie)).not.toContain('cm_access_token');
  });

  test('shows an error for invalid credentials and stays on /login', async ({ page }) => {
    await page.goto('/login');
    await signIn(page, { email: ADMIN.email, password: 'wrong-password' });

    // Filter by text: Next.js also renders an empty role="alert" route announcer.
    await expect(
      page.getByRole('alert').filter({ hasText: 'Invalid email or password' }),
    ).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('returns to the originally requested admin page after sign-in', async ({ page }) => {
    await page.goto('/admin?tab=farmers');
    await expect(page).toHaveURL('/login?next=%2Fadmin%3Ftab%3Dfarmers');

    await signIn(page, ADMIN);

    await expect(page).toHaveURL('/admin?tab=farmers');
  });

  test('buyers cannot reach admin pages', async ({ page }) => {
    await page.goto('/login');
    await signIn(page, BUYER);
    await expect(page).toHaveURL('/');

    await page.goto('/admin');

    await expect(page).toHaveURL('/login?next=%2Fadmin');
  });

  test('a token signed with the wrong key is rejected', async ({ page, context }) => {
    const forged = await signToken(
      'ADMIN',
      new TextEncoder().encode('not-the-real-secret-but-long-enough!!'),
    );
    await context.addCookies([{ name: 'cm_access_token', value: forged, url: BASE_URL }]);

    await page.goto('/admin');

    await expect(page).toHaveURL('/login?next=%2Fadmin');
  });

  test('a signed-in admin visiting /login goes straight to the dashboard', async ({
    page,
    context,
  }) => {
    const token = await signToken(
      'ADMIN',
      new Uint8Array(Buffer.from(E2E_JWT_SECRET, 'base64')),
    );
    await context.addCookies([{ name: 'cm_access_token', value: token, url: BASE_URL }]);

    await page.goto('/login');

    await expect(page).toHaveURL('/admin');
  });

  test('signing out ends the session', async ({ page }) => {
    await page.goto('/login');
    await signIn(page, ADMIN);
    await expect(page).toHaveURL('/admin');

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');

    await page.goto('/admin');
    await expect(page).toHaveURL('/login?next=%2Fadmin');
  });
});
