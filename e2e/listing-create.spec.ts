import { randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { listProducts, seedCategory, seedFarmer } from './support/api';
import { signInAsAdmin } from './support/session';

// A real 1×1 PNG so previews render.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const photo = (name: string, mimeType = 'image/png', buffer = PNG) => ({ name, mimeType, buffer });

const fileInput = (page: Page) => page.locator('input[type="file"]');
const today = () => new Date().toLocaleDateString('en-CA');

test.describe('Create listing', () => {
  let farmer: { id: string; fullName: string };
  let category: { id: string; name: string };

  test.beforeEach(async () => {
    const id = randomUUID().slice(0, 6);
    farmer = await seedFarmer(`Kwame Listing ${id}`);
    category = await seedCategory(`Tubers ${id}`);
  });

  test('admin creates a listing from the dashboard and it is saved for the farmer', async ({ page }) => {
    const name = `Yam ${randomUUID().slice(0, 6)}`;
    await signInAsAdmin(page);
    await page.getByRole('link', { name: 'Create new listing' }).click();
    await expect(page).toHaveURL('/admin/listings/create');

    await page.getByLabel('Farmer', { exact: true }).selectOption({ label: `${farmer.fullName} — Volta` });
    await page.getByLabel('Category', { exact: true }).selectOption({ label: category.name });
    await page.getByLabel('Produce name').fill(name);
    await page.getByLabel('Description (optional)').fill('Freshly dug white yam.');
    await page.getByLabel('Price (GH₵)').fill('25.50');
    await page.getByLabel('Unit').selectOption('per tuber');
    await page.getByLabel('Harvest date').fill(today());
    await fileInput(page).setInputFiles([photo('yam-1.png'), photo('yam-2.png')]);
    await expect(page.getByRole('list', { name: 'Selected photos' }).getByRole('img')).toHaveCount(2);

    await page.getByRole('button', { name: 'Create listing' }).click();

    await expect(page.getByText(`"${name}" is now listed for ${farmer.fullName}.`)).toBeVisible();
    // Form is cleared for the next listing, keeping the farmer.
    await expect(page.getByLabel('Produce name')).toHaveValue('');
    await expect(page.getByLabel('Farmer', { exact: true })).toHaveValue(farmer.id);

    const saved = (await listProducts()).find((p) => p.name === name);
    expect(saved).toMatchObject({
      farmerId: farmer.id,
      categoryId: category.id,
      description: 'Freshly dug white yam.',
      priceCents: 2550,
      unit: 'per tuber',
      harvestDate: today(),
      listingStatus: 'ACTIVE',
    });
    expect(saved?.imageUrls).toHaveLength(2);
  });

  test('validates the form before uploading anything', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/listings/create');

    await page.getByLabel('Price (GH₵)').fill('0');
    await page.getByRole('button', { name: 'Create listing' }).click();

    await expect(page.getByText('Select the farmer selling this produce.')).toBeVisible();
    await expect(page.getByText('Price must be greater than zero.')).toBeVisible();
    await expect(page.getByText('Add at least one photo.')).toBeVisible();
  });

  test('rejects non-image files and more than 5 photos', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/listings/create');

    await fileInput(page).setInputFiles([
      photo('notes.txt', 'text/plain', Buffer.from('hello')),
      ...Array.from({ length: 6 }, (_, i) => photo(`p${i}.png`)),
    ]);

    await expect(page.getByText('"notes.txt" must be a JPEG or PNG image.')).toBeVisible();
    await expect(page.getByText('A listing can have at most 5 photos; 1 not added.')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Selected photos' }).getByRole('img')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Add more photos' })).toBeDisabled();
  });

  test('the form has no WCAG 2.1 AA violations', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/listings/create');
    await page.getByRole('button', { name: 'Create listing' }).click();
    await expect(page.getByText('Add at least one photo.')).toBeVisible();

    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(scan.violations).toEqual([]);
  });
});
