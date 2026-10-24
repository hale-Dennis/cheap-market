import { randomInt, randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import { signInAsAdmin } from './support/session';

// Tests share one stub API process, so every farmer gets unique contact details.
function uniqueFarmer() {
  const id = randomUUID().slice(0, 8);
  const subscriber = String(randomInt(0, 10_000_000)).padStart(7, '0');
  return {
    fullName: `Ama Mensah ${id}`,
    email: `ama.${id}@test.com`,
    phone: `024${subscriber}`,
    displayPhone: `024 ${subscriber.slice(0, 3)} ${subscriber.slice(3)}`,
  };
}

async function fillFarmerForm(page: Page, farmer: ReturnType<typeof uniqueFarmer>) {
  await page.getByLabel('Full name').fill(farmer.fullName);
  await page.getByLabel('Home region').selectOption({ label: 'Greater Accra' });
  await page.getByLabel('Phone number').fill(farmer.phone);
  await page.getByLabel('Email').fill(farmer.email);
}

test.describe('Create farmer', () => {
  test('admin opens Create Farmer from the dashboard, registers a farmer and sees them in the list', async ({
    page,
  }) => {
    const farmer = uniqueFarmer();
    await signInAsAdmin(page);

    await page.getByRole('link', { name: 'Create farmer' }).click();
    await expect(page).toHaveURL('/admin/farmers/create');
    await expect(page.getByRole('heading', { name: 'Create farmer' })).toBeVisible();

    await fillFarmerForm(page, farmer);
    await page.getByRole('button', { name: 'Create farmer' }).click();

    await expect(page).toHaveURL('/admin/farmers');
    await expect(
      page.getByText(`${farmer.fullName} has been registered as a farmer.`),
    ).toBeVisible();
    const row = page.getByRole('row', { name: new RegExp(farmer.fullName) });
    await expect(row).toContainText('Greater Accra');
    await expect(row).toContainText(farmer.displayPhone);
    await expect(row).toContainText(farmer.email);
  });

  test('shows validation errors without submitting', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/farmers/create');

    await page.getByRole('button', { name: 'Create farmer' }).click();

    await expect(page.getByText('Full name is required.')).toBeVisible();
    await expect(page.getByText('Select a region.')).toBeVisible();
    await expect(page.getByText('Phone number is required.')).toBeVisible();
    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page).toHaveURL('/admin/farmers/create');
  });

  test('reports a duplicate phone number from the API', async ({ page }) => {
    const existing = uniqueFarmer();
    await signInAsAdmin(page);
    await page.goto('/admin/farmers/create');
    await fillFarmerForm(page, existing);
    await page.getByRole('button', { name: 'Create farmer' }).click();
    await expect(page).toHaveURL('/admin/farmers');

    await page.goto('/admin/farmers/create');
    await fillFarmerForm(page, {
      ...uniqueFarmer(),
      // Same number written in international format must still be caught.
      phone: `+233 ${existing.phone.slice(1)}`,
    });
    await page.getByRole('button', { name: 'Create farmer' }).click();

    await expect(
      page.getByRole('alert').filter({ hasText: 'A user with this phone number already exists.' }),
    ).toBeVisible();
    await expect(page).toHaveURL('/admin/farmers/create');
  });

  test('unauthenticated visitors are sent to login', async ({ page }) => {
    await page.goto('/admin/farmers/create');

    await expect(page).toHaveURL('/login?next=%2Fadmin%2Ffarmers%2Fcreate');
  });
});
