import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

import { scanWcag } from './support/a11y';

import { seedCategory, seedFarmer, seedListing } from './support/api';
import { BUYER } from './support/config';
import { signIn } from './support/session';

// This spec owns the UPPER_EAST region in the shared stub. Serial, so the seed data is created once.
test.describe.configure({ mode: 'serial' });

test.describe('Product detail', () => {
  const id = randomUUID().slice(0, 6);
  const name = `UE Shea Butter ${id}`;
  let farmerName: string;
  let productId: string;

  test.beforeAll(async () => {
    const farmer = await seedFarmer(`Upper East Farmer ${id}`, 'UPPER_EAST');
    farmerName = farmer.fullName;
    const category = await seedCategory(`Pantry ${id}`);
    const product = await seedListing({
      farmerId: farmer.id,
      categoryId: category.id,
      name,
      priceCents: 4500,
      description: 'Hand-processed raw shea butter.',
      imageUrls: [1, 2, 3].map(() => `/api/v1/media/${randomUUID()}.jpg`),
    });
    productId = product.id;
  });

  test('a visitor opens a product from the catalog and sees all its details', async ({ page, context }) => {
    await context.addCookies([{ name: 'cm_region', value: 'UPPER_EAST', url: 'http://localhost:3100' }]);
    await page.goto('/products');

    await page.getByRole('link', { name: new RegExp(name) }).click();

    await expect(page).toHaveURL(`/products/${productId}`);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(page.getByText('GH₵ 45.00')).toBeVisible();
    await expect(page.getByText('per kg', { exact: true })).toBeVisible();
    await expect(page.getByText(/Harvested on .+ \(today\)/)).toBeVisible();
    await expect(page.getByText('Hand-processed raw shea butter.')).toBeVisible();
    await expect(page.getByText(farmerName)).toBeVisible();
    await expect(page.getByText('Upper East region')).toBeVisible();
    await expect(page.getByText('No ratings yet')).toBeVisible();

    // All three photos are reachable.
    await expect(page.getByRole('img', { name: `${name}, photo 1 of 3` })).toBeVisible();
    await page.getByRole('button', { name: 'Show photo 3 of 3' }).click();
    await expect(page.getByRole('img', { name: `${name}, photo 3 of 3` })).toBeVisible();

    // Structured data for search engines.
    const jsonLd = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    expect(jsonLd).toMatchObject({ '@type': 'Product', name, offers: { price: '45.00', priceCurrency: 'GHS' } });
    expect(jsonLd.image).toHaveLength(3);
  });

  test('a visitor signs in from the product and adds it to their cart', async ({ page }) => {
    await page.goto(`/products/${productId}`);

    await page.getByRole('link', { name: 'Sign in to add to cart' }).click();
    await signIn(page, BUYER);

    // Returned to the product, now as a buyer.
    await expect(page).toHaveURL(`/products/${productId}`);
    await expect(page.getByText(/Cart · \d+ items?/)).toBeVisible();

    await page.getByLabel('Quantity').fill('2');
    await page.getByRole('button', { name: 'Add to cart' }).click();

    // The stub buyer's cart is shared by tests, so this may add to an earlier quantity.
    await expect(page.getByText(new RegExp(`Added 2 (× ${name} \\(per kg\\) to your cart|more)`))).toBeVisible();
    // The stub buyer's cart is shared by tests, so check the header count includes these 2.
    const count = Number(/Cart · (\d+)/.exec(await page.getByText(/Cart · \d+/).innerText())![1]);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('an unknown product shows the not-found page', async ({ page }) => {
    const response = await page.goto(`/products/${randomUUID()}`);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: "We couldn't find that page" })).toBeVisible();
    await page.getByRole('link', { name: 'Browse produce' }).click();
    await expect(page).toHaveURL('/products');
  });

  test('the product page has no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto(`/products/${productId}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    expect(await scanWcag(page)).toEqual([]);
  });
});
