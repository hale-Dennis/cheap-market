import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import { scanWcag } from './support/a11y';

import { seedCategory, seedFarmer, seedListing, seedOrders, setOrderStatus } from './support/api';

// This spec owns the BONO_EAST region in the shared stub. Each test signs up its own buyer.
test.describe.configure({ mode: 'serial' });

test.describe('My orders', () => {
  const id = randomUUID().slice(0, 6);
  let productId: string;

  test.beforeAll(async () => {
    const farmer = await seedFarmer(`Bono East Farmer ${id}`, 'BONO_EAST');
    const category = await seedCategory(`History ${id}`);
    productId = (await seedListing({ farmerId: farmer.id, categoryId: category.id, name: `Yam ${id}`, priceCents: 2000 })).id;
  });

  async function signUpBuyer(page: Page) {
    const email = `history.${randomUUID().slice(0, 8)}@example.com`;
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('History Buyer');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Home region').selectOption({ label: 'Bono East' });
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByLabel('Confirm password').fill('Password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/buyer/profile');
    await page.getByLabel('Street address').fill('1 Market St');
    await page.getByLabel('Town / city').fill('Techiman');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Your profile has been saved.')).toBeVisible();
    return email;
  }

  /** Places a home-delivery order through the API (as the checkout does) and returns its id and number. */
  async function placeOrder(page: Page, quantity: number) {
    await page.request.post('/api/v1/cart', { data: { productId, quantity } });
    const response = await page.request.post('/api/v1/orders', {
      headers: { 'Idempotency-Key': `e2e-${randomUUID()}` },
      data: { fulfillmentType: 'DELIVERY' },
    });
    expect(response.status()).toBe(201);
    return (await response.json()).data as { orderId: string; orderNumber: string };
  }

  const rows = (page: Page) => page.getByRole('list', { name: 'Your orders' }).getByRole('listitem');

  test('a buyer without orders sees the empty state, reached from their profile', async ({ page }) => {
    await signUpBuyer(page);

    await page.getByRole('main').getByRole('link', { name: 'View my orders' }).click();

    await expect(page).toHaveURL('/orders');
    await expect(page.getByRole('heading', { name: 'No orders yet' })).toBeVisible();
  });

  test('lists orders newest first with date, total and status, and opens an order', async ({ page }) => {
    await signUpBuyer(page);
    const older = await placeOrder(page, 1);
    const newer = await placeOrder(page, 3);
    await setOrderStatus(older.orderId, 'COMPLETED');

    await page.getByRole('banner').getByRole('link', { name: 'My orders' }).click();

    await expect(page).toHaveURL('/orders');
    await expect(rows(page)).toHaveCount(2);
    await expect(rows(page).nth(0)).toContainText(newer.orderNumber);
    await expect(rows(page).nth(0)).toContainText('3 items · Delivery');
    await expect(rows(page).nth(0)).toContainText('Pending');
    await expect(rows(page).nth(0)).toContainText('GH₵ 70.00');
    await expect(rows(page).nth(1)).toContainText(older.orderNumber);
    await expect(rows(page).nth(1)).toContainText('Completed');
    await expect(rows(page).nth(1)).toContainText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));

    await rows(page).nth(1).getByRole('link').click();
    await expect(page).toHaveURL(`/orders/${older.orderId}`);
    await expect(page.getByRole('heading', { name: `Order ${older.orderNumber}` })).toBeVisible();
    await page.getByRole('link', { name: '← My orders' }).click();
    await expect(page).toHaveURL('/orders');
  });

  test('infinite scroll loads more than two pages of orders', async ({ page }) => {
    await seedOrders(await signUpBuyer(page), productId, 25);

    // A short window, so the first page fills it and the end of the list starts off-screen.
    await page.setViewportSize({ width: 1280, height: 500 });
    await page.goto('/orders');
    await expect(page.getByText('25 orders')).toBeVisible();
    // The next page is prefetched while still off-screen, but not everything loads up front.
    await expect(rows(page).first()).toBeVisible();
    expect(await rows(page).count()).toBeLessThan(25);

    // Scrolling to the end keeps loading until all 25 are shown.
    await expect(async () => {
      await page.mouse.wheel(0, 10_000);
      expect(await rows(page).count()).toBe(25);
    }).toPass();
    await expect(page.getByText("That's all your orders.")).toBeVisible();
  });

  test('My orders has no WCAG 2.1 AA violations', async ({ page }) => {
    await signUpBuyer(page);
    const order = await placeOrder(page, 2);
    await setOrderStatus(order.orderId, 'OUT_FOR_DELIVERY');
    await page.goto('/orders');
    await expect(rows(page)).toHaveCount(1);

    expect(await scanWcag(page)).toEqual([]);
  });
});
