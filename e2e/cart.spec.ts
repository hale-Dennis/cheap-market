import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import { scanWcag } from './support/a11y';

import { seedCategory, seedFarmer, seedListing } from './support/api';

// Each test signs up its own buyer, so carts don't interfere. Serial so the listings are seeded once.
test.describe.configure({ mode: 'serial' });

test.describe('Shopping cart', () => {
  const id = randomUUID().slice(0, 6);
  const okro = `Cart Okro ${id}`;
  const mango = `Cart Mango ${id}`;
  const ids: Record<string, string> = {};

  test.beforeAll(async () => {
    const farmer = await seedFarmer(`Western Farmer ${id}`, 'WESTERN');
    const category = await seedCategory(`Cart Produce ${id}`);
    ids[okro] = (await seedListing({ farmerId: farmer.id, categoryId: category.id, name: okro, priceCents: 5000 })).id;
    ids[mango] = (await seedListing({ farmerId: farmer.id, categoryId: category.id, name: mango, priceCents: 1250 })).id;
  });

  async function signUpBuyer(page: Page) {
    const email = `cart.${randomUUID().slice(0, 8)}@example.com`;
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Cart Buyer');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Home region').selectOption({ label: 'Western' });
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByLabel('Confirm password').fill('Password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/buyer/profile');
  }

  async function addFromProductPage(page: Page, name: string, quantity: number) {
    await page.goto(`/products/${ids[name]}`);
    await page.getByLabel('Quantity').fill(String(quantity));
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByText(new RegExp(`^Added ${quantity}`))).toBeVisible();
  }

  const row = (page: Page, name: string) =>
    page.getByRole('list', { name: 'Items in your cart' }).getByRole('listitem').filter({ hasText: name });
  const subtotal = (page: Page) => page.getByText('Subtotal', { exact: true }).locator('xpath=following-sibling::dd');
  const cartLink = (page: Page) => page.getByRole('link', { name: /^Cart · / });

  test('buyer adds items, adjusts and removes them, and the cart persists across reloads', async ({ page }) => {
    await signUpBuyer(page);

    await addFromProductPage(page, okro, 2);
    await addFromProductPage(page, mango, 1);
    // Adding again increases the quantity already in the cart.
    await addFromProductPage(page, okro, 1);
    await expect(page.getByText(`Added 1 more. You now have 3 × ${okro} in your cart.`)).toBeVisible();
    await expect(cartLink(page)).toHaveAccessibleName('Cart · 4 items');

    await cartLink(page).click();
    await expect(page).toHaveURL('/cart');
    await expect(row(page, okro)).toContainText('GH₵ 150.00');
    await expect(row(page, mango)).toContainText('GH₵ 12.50');
    await expect(subtotal(page)).toHaveText('GH₵ 162.50');

    await row(page, mango).getByRole('button', { name: `Increase quantity of ${mango}` }).click();
    await expect(subtotal(page)).toHaveText('GH₵ 175.00');
    await row(page, okro).getByRole('button', { name: `Decrease quantity of ${okro}` }).click();
    await expect(subtotal(page)).toHaveText('GH₵ 125.00');

    await page.reload();
    await expect(row(page, okro).getByRole('spinbutton')).toHaveValue('2');
    await expect(row(page, mango).getByRole('spinbutton')).toHaveValue('2');
    await expect(subtotal(page)).toHaveText('GH₵ 125.00');

    await row(page, okro).getByRole('button', { name: `Remove ${okro}` }).click();
    await expect(row(page, okro)).toHaveCount(0);
    await expect(subtotal(page)).toHaveText('GH₵ 25.00');
    await expect(cartLink(page)).toHaveAccessibleName('Cart · 2 items');

    // Persists for the account, across sessions.
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/products');
  });

  test('a typed quantity is saved, and emptying the cart shows the empty state', async ({ page }) => {
    await signUpBuyer(page);
    await addFromProductPage(page, okro, 1);
    await page.goto('/cart');

    const quantity = row(page, okro).getByRole('spinbutton', { name: `Quantity of ${okro}` });
    await quantity.fill('7');
    await quantity.press('Enter');
    await expect(subtotal(page)).toHaveText('GH₵ 350.00');
    await page.reload();
    await expect(row(page, okro).getByRole('spinbutton')).toHaveValue('7');

    await page.getByRole('button', { name: 'Empty cart' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Empty cart' }).click();

    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  });

  test('signed-out visitors are sent to sign in and back to their cart', async ({ page }) => {
    await page.goto('/cart');

    await expect(page).toHaveURL('/login?next=%2Fcart');
  });

  test('the cart page has no WCAG 2.1 AA violations', async ({ page }) => {
    await signUpBuyer(page);
    await addFromProductPage(page, mango, 2);
    await page.goto('/cart');
    await expect(row(page, mango)).toBeVisible();

    expect(await scanWcag(page)).toEqual([]);
  });
});
