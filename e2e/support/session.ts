import type { Page } from '@playwright/test';

import { ADMIN } from './config';

export async function signIn(
  page: Page,
  credentials: { email: string; password: string },
) {
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function signInAsAdmin(page: Page) {
  await page.goto('/login');
  await signIn(page, ADMIN);
  await page.waitForURL('/admin');
}
