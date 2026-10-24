import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import { scanWcag } from './support/a11y';

import { seedCategory, seedFarmer, seedListing } from './support/api';
import { BUYER } from './support/config';
import { signIn } from './support/session';

// Region ownership across specs sharing the stub: this spec seeds UPPER_WEST and NORTH_EAST;
// SAVANNAH is never seeded, so it is always empty; the stub's buyer lives in ASHANTI.
test.describe.configure({ mode: 'serial' });

const grid = (page: Page) => page.getByRole('region', { name: 'Produce' });
const cardNames = (page: Page) => grid(page).getByRole('heading').allInnerTexts();

test.describe('Public catalog', () => {
  const id = randomUUID().slice(0, 6);
  const names = {
    yam: `UW Yam ${id}`,
    mango: `UW Mango ${id}`,
    elsewhere: `NE Millet ${id}`,
  };
  let fruitsCategoryId: string;

  test.beforeAll(async () => {
    const upperWest = await seedFarmer(`Upper West Farmer ${id}`, 'UPPER_WEST');
    const northEast = await seedFarmer(`North East Farmer ${id}`, 'NORTH_EAST');
    const tubers = await seedCategory(`Tubers ${id}`);
    const fruits = await seedCategory(`Fruits ${id}`);
    fruitsCategoryId = fruits.id;
    await seedListing({ farmerId: upperWest.id, categoryId: tubers.id, name: names.yam, priceCents: 2550 });
    await seedListing({ farmerId: upperWest.id, categoryId: fruits.id, name: names.mango, priceCents: 800 });
    await seedListing({ farmerId: northEast.id, categoryId: tubers.id, name: names.elsewhere });
  });

  test('a visitor picks a region and sees only that region\'s produce, without signing in', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByRole('heading', { name: 'Where are you shopping?' })).toBeVisible();

    await page.getByLabel('Your region').selectOption({ label: 'Upper West' });
    await page.getByRole('button', { name: 'Show produce' }).click();

    await expect(page.getByText(/Showing produce from farmers in/)).toContainText('Upper West');
    // Wait for the grid to load before reading it.
    await expect.poll(() => cardNames(page)).toEqual(expect.arrayContaining([names.yam, names.mango]));
    expect(await cardNames(page)).not.toContain(names.elsewhere);

    const yam = grid(page).getByRole('link', { name: new RegExp(names.yam) });
    await expect(yam).toContainText('GH₵ 25.50 per kg');
    await expect(yam).toContainText('Harvested today');
    await expect(yam.getByRole('img')).toHaveJSProperty('complete', true);
    await expect(yam).toHaveAttribute('href', /^\/products\/[0-9a-f-]{36}$/);

    // The region is remembered.
    await page.reload();
    await expect(page.getByText(/Showing produce from farmers in/)).toContainText('Upper West');
  });

  test('filters by category and clears the filter', async ({ page, context }) => {
    await context.addCookies([{ name: 'cm_region', value: 'UPPER_WEST', url: 'http://localhost:3100' }]);
    await page.goto('/products');
    await expect(grid(page)).toBeVisible();

    await page.getByLabel('Category').selectOption(fruitsCategoryId);

    await expect(page).toHaveURL(`/products?category=${fruitsCategoryId}`);
    await expect.poll(() => cardNames(page)).toEqual([names.mango]);

    await page.getByLabel('Category').selectOption({ label: 'All categories' });
    await expect(page).toHaveURL('/products');
    await expect.poll(() => cardNames(page)).toEqual(expect.arrayContaining([names.yam, names.mango]));
  });

  test('a region without produce shows an empty state', async ({ page, context }) => {
    await context.addCookies([{ name: 'cm_region', value: 'UPPER_WEST', url: 'http://localhost:3100' }]);
    await page.goto('/products');
    await page.getByRole('button', { name: 'Change region' }).click();
    await page.getByLabel('Your region').selectOption({ label: 'Savannah' });
    await page.getByRole('button', { name: 'Update' }).click();

    await expect(page.getByRole('heading', { name: 'No produce in Savannah yet' })).toBeVisible();
  });

  test("a signed-in buyer sees their profile region without being asked", async ({ page }) => {
    await page.goto('/login');
    await signIn(page, BUYER);
    await expect(page).toHaveURL('/buyer/profile');

    await page.goto('/products');

    await expect(page.getByText(/Showing produce from farmers in/)).toContainText('Ashanti');
    await expect(page.getByRole('link', { name: 'My account' })).toBeVisible();
  });

  test('the catalog has no WCAG 2.1 AA violations', async ({ page, context }) => {
    await context.addCookies([{ name: 'cm_region', value: 'UPPER_WEST', url: 'http://localhost:3100' }]);
    await page.goto('/products');
    await expect(grid(page)).toBeVisible();

    expect(await scanWcag(page)).toEqual([]);
  });
});
