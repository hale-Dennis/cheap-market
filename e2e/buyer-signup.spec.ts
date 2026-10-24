import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import { signIn } from './support/session';

// Tests share one stub API process, so every buyer gets a unique email.
function newBuyer() {
  const id = randomUUID().slice(0, 8);
  return { fullName: `Jane Doe ${id}`, email: `jane.${id}@example.com`, password: 'Password123' };
}

async function signUp(page: Page, buyer: ReturnType<typeof newBuyer>) {
  await page.getByLabel('Full name').fill(buyer.fullName);
  await page.getByLabel('Email').fill(buyer.email);
  await page.getByLabel('Home region').selectOption({ label: 'Ashanti' });
  await page.getByLabel('Password', { exact: true }).fill(buyer.password);
  await page.getByLabel('Confirm password').fill(buyer.password);
  await page.getByRole('button', { name: 'Create account' }).click();
}

test.describe('Buyer sign-up and profile', () => {
  test('a visitor signs up from the home page, is signed in and saves a delivery address', async ({
    page,
    context,
  }) => {
    const buyer = newBuyer();
    await page.goto('/');
    await page.getByRole('link', { name: 'Create an account' }).click();
    await expect(page).toHaveURL('/signup');

    await signUp(page, buyer);

    // Signed in automatically and taken to the profile.
    await expect(page).toHaveURL('/buyer/profile');
    await expect(page.getByText('Welcome to Cheap Market! Your account is ready.')).toBeVisible();
    const cookie = (await context.cookies()).find((c) => c.name === 'cm_access_token');
    expect(cookie?.httpOnly).toBe(true);
    await expect(page.getByLabel('Full name')).toHaveValue(buyer.fullName);
    await expect(page.getByRole('main').getByText(buyer.email)).toBeVisible();
    await expect(page.getByLabel('Home region')).toHaveValue('ASHANTI');

    await page.getByLabel('Street address').fill('123 Market Rd');
    await page.getByLabel('Town / city').fill('Kumasi');
    await page.getByLabel('GPS address (optional)').fill('ak-123-4567');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Your profile has been saved.')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Street address')).toHaveValue('123 Market Rd');
    await expect(page.getByLabel('Town / city')).toHaveValue('Kumasi');
    await expect(page.getByLabel('GPS address (optional)')).toHaveValue('AK-123-4567');
  });

  test('a returning buyer signs in and sees their profile', async ({ page }) => {
    const buyer = newBuyer();
    await page.goto('/signup');
    await signUp(page, buyer);
    await expect(page).toHaveURL('/buyer/profile');

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/');
    await page.goto('/login');
    // Email matching is case-insensitive.
    await signIn(page, { email: buyer.email.toUpperCase(), password: buyer.password });

    await expect(page).toHaveURL('/buyer/profile');
    await expect(page.getByLabel('Full name')).toHaveValue(buyer.fullName);
  });

  test('shows validation errors for a weak password and mismatched confirmation', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByLabel('Confirm password').fill('different');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Password must contain at least one uppercase letter.')).toBeVisible();
    await expect(page.getByText('Passwords do not match.')).toBeVisible();
    await expect(page).toHaveURL('/signup');
  });

  test('reports an email that is already registered', async ({ page }) => {
    const buyer = newBuyer();
    await page.goto('/signup');
    await signUp(page, buyer);
    await expect(page).toHaveURL('/buyer/profile');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/');

    await page.goto('/signup');
    await signUp(page, { ...buyer, fullName: 'Someone Else' });

    await expect(
      page.getByRole('alert').filter({ hasText: 'A user with this email already exists.' }),
    ).toBeVisible();
    await expect(page).toHaveURL('/signup');
  });

  test('signed-out visitors to buyer pages are sent to sign-up and returned afterwards', async ({ page }) => {
    await page.goto('/buyer/profile');
    await expect(page).toHaveURL('/signup?next=%2Fbuyer%2Fprofile');

    await signUp(page, newBuyer());

    await expect(page).toHaveURL('/buyer/profile');
  });
});
