import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import { scanWcag } from './support/a11y';

import { seedCategory, seedFarmer, seedListing, seedPickupLocation } from './support/api';

// This spec owns the CENTRAL region (with pickup points) in the shared stub; EASTERN has none.
// Each test signs up its own buyer. Serial so seed data is created once.
test.describe.configure({ mode: 'serial' });

test.describe('Checkout', () => {
  const id = randomUUID().slice(0, 6);
  let productId: string;

  test.beforeAll(async () => {
    const farmer = await seedFarmer(`Central Farmer ${id}`, 'CENTRAL');
    const category = await seedCategory(`Checkout ${id}`);
    productId = (await seedListing({ farmerId: farmer.id, categoryId: category.id, name: `Cassava ${id}`, priceCents: 2500 })).id;
    await seedPickupLocation(`Kotokuraba Market ${id}`, 'CENTRAL');
    await seedPickupLocation(`Abura Station ${id}`, 'CENTRAL');
  });

  async function buyerWithCart(page: Page, { region = 'Central', address = true } = {}) {
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Checkout Buyer');
    await page.getByLabel('Email').fill(`checkout.${randomUUID().slice(0, 8)}@example.com`);
    await page.getByLabel('Home region').selectOption({ label: region });
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByLabel('Confirm password').fill('Password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/buyer/profile');
    if (address) {
      await page.getByLabel('Street address').fill('5 Commercial St');
      await page.getByLabel('Town / city').fill('Cape Coast');
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByText('Your profile has been saved.')).toBeVisible();
    }
    await page.goto(`/products/${productId}`);
    await page.getByLabel('Quantity').fill('2');
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByText(/^Added 2/)).toBeVisible();
  }

  const total = (page: Page) => page.getByText('Total', { exact: true }).locator('xpath=following-sibling::dd');
  const feeLine = (page: Page) => page.getByText(/^(Delivery|Pickup)$/).locator('xpath=following-sibling::dd');

  test('buyer goes from cart to checkout and sees correct totals for each option', async ({ page }) => {
    await buyerWithCart(page);
    await page.goto('/cart');
    await page.getByRole('link', { name: 'Proceed to checkout' }).click();

    await expect(page).toHaveURL('/checkout');
    await expect(page.getByRole('list', { name: 'Items' })).toContainText(`Cassava ${id} × 2`);
    await expect(feeLine(page)).toHaveText('Choose an option');
    await expect(total(page)).toHaveText('GH₵ 50.00');

    // Home delivery: profile address + flat fee.
    await page.getByLabel(/Home delivery/).check();
    await expect(page.getByText('Delivered to 5 Commercial St, Cape Coast')).toBeVisible();
    await expect(feeLine(page)).toHaveText('GH₵ 10.00');
    await expect(total(page)).toHaveText('GH₵ 60.00');

    // Pickup: free, choose from the region's locations (sorted by name).
    await page.getByLabel(/Collect from a pickup point/).check();
    const pickup = page.getByLabel('Pickup point', { exact: true });
    // Other runs may have added Central pickup points too, so check this run's two and their order.
    const options = (await pickup.locator('option:not([disabled])').allInnerTexts()).filter((name) => name.endsWith(id));
    expect(options).toEqual([`Abura Station ${id}`, `Kotokuraba Market ${id}`]);
    await pickup.selectOption({ label: `Kotokuraba Market ${id}` });
    await expect(page.getByText(`Kotokuraba Market ${id} Road, Cape Coast · Open Mon–Sat 7am–6pm`)).toBeVisible();
    await expect(feeLine(page)).toHaveText('Free');
    await expect(total(page)).toHaveText('GH₵ 50.00');

    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page).toHaveURL(/\/orders\/confirmation\?orderId=/);
  });

  test('continuing without a choice shows an error', async ({ page }) => {
    await buyerWithCart(page);
    await page.goto('/checkout');

    await page.getByRole('button', { name: 'Place order' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Choose home delivery or a pickup point.' })).toBeVisible();

    await page.getByLabel(/Collect from a pickup point/).check();
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Choose a pickup point.' }).first()).toBeVisible();
  });

  test('pickup is unavailable in a region without pickup points; delivery needs an address', async ({ page }) => {
    await buyerWithCart(page, { region: 'Eastern', address: false });
    await page.goto('/checkout');

    await expect(page.getByText('There are no pickup points in Eastern yet. Choose home delivery instead.')).toBeVisible();
    await expect(page.getByLabel(/Collect from a pickup point/)).toBeDisabled();
    await expect(page.getByLabel(/Home delivery/)).toBeDisabled();
    await expect(page.getByText(/Add a delivery address to your profile/)).toBeVisible();
  });

  test('signed-out visitors are sent to sign up', async ({ page }) => {
    await page.goto('/checkout');

    await expect(page).toHaveURL('/signup?next=%2Fcheckout');
  });

  test('checkout has no WCAG 2.1 AA violations', async ({ page }) => {
    await buyerWithCart(page);
    await page.goto('/checkout');
    await page.getByLabel(/Collect from a pickup point/).check();
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Choose a pickup point.' }).first()).toBeVisible();

    expect(await scanWcag(page)).toEqual([]);
  });
});
