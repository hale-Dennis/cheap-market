import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import { scanWcag } from './support/a11y';
import { seedCategory, seedFarmer, seedListing, setOrderStatus } from './support/api';
import { signInAsAdmin } from './support/session';

// This spec owns the WESTERN_NORTH region in the shared stub. Each test signs up its own buyer.
test.describe.configure({ mode: 'serial' });

test.describe('Reporting an issue with an order', () => {
  const id = randomUUID().slice(0, 6);
  const farmer = `Western North Farmer ${id}`;
  let productId: string;

  test.beforeAll(async () => {
    const westernNorthFarmer = await seedFarmer(farmer, 'WESTERN_NORTH');
    const category = await seedCategory(`Disputes ${id}`);
    productId = (await seedListing({ farmerId: westernNorthFarmer.id, categoryId: category.id, name: `Shea ${id}`, priceCents: 3000 })).id;
  });

  async function signUpBuyer(page: Page, fullName = 'Dispute Buyer') {
    await page.goto('/signup');
    await page.getByLabel('Full name').fill(fullName);
    await page.getByLabel('Email').fill(`dispute.${randomUUID().slice(0, 8)}@example.com`);
    await page.getByLabel('Home region').selectOption({ label: 'Western North' });
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByLabel('Confirm password').fill('Password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/buyer/profile');
    await page.getByLabel('Street address').fill('7 Bolgatanga Rd');
    await page.getByLabel('Town / city').fill('Tamale');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Your profile has been saved.')).toBeVisible();
  }

  async function placeOrder(page: Page, status: string) {
    await page.request.post('/api/v1/cart', { data: { productId, quantity: 2 } });
    const response = await page.request.post('/api/v1/orders', {
      headers: { 'Idempotency-Key': `e2e-${randomUUID()}` },
      data: { fulfillmentType: 'DELIVERY' },
    });
    expect(response.status()).toBe(201);
    const order = (await response.json()).data as { orderId: string; orderNumber: string };
    await setOrderStatus(order.orderId, status);
    return order;
  }

  // The current step of the order's status track.
  const status = (page: Page) => page.getByRole('list', { name: 'Order progress' }).locator('[aria-current="step"]');

  test('a buyer reports an issue: the order becomes Disputed and the admin is notified', async ({ page, browser }) => {
    const buyerName = `Dispute Buyer ${id}`;
    await signUpBuyer(page, buyerName);
    const order = await placeOrder(page, 'COMPLETED');

    await page.goto(`/orders/${order.orderId}`);
    await expect(status(page)).toContainText('Completed');
    await page.getByRole('button', { name: 'Report issue' }).click();
    const dialog = page.getByRole('dialog', { name: 'Report an issue' });
    await expect(dialog.getByRole('button', { name: 'Submit report' })).toBeDisabled();
    await dialog.getByPlaceholder('Describe the issue').fill('Two of the shea butter tubs were cracked and leaking.');
    await expect(dialog.getByText('53/500 characters')).toBeVisible();
    await dialog.getByRole('button', { name: 'Submit report' }).click();

    await expect(page.getByText("Thanks for letting us know. We'll review the issue and get back to you.")).toBeVisible();
    await expect(status(page)).toContainText('Disputed');
    await expect(page.getByRole('region', { name: 'Issue reported' })).toContainText('Two of the shea butter tubs were cracked and leaking.');
    await expect(page.getByRole('button', { name: 'Report issue' })).toHaveCount(0);
    // The farmer can still be rated.
    await expect(page.getByRole('button', { name: `Rate ${farmer}` })).toBeVisible();

    // My orders shows the new status.
    await page.getByRole('link', { name: '← My orders' }).click();
    await expect(page.getByRole('list', { name: 'Your orders' }).getByRole('listitem').filter({ hasText: order.orderNumber }))
      .toContainText('Disputed');

    // The admin sees it on the dashboard.
    const admin = await browser.newPage();
    await signInAsAdmin(admin);
    await expect(admin.getByRole('list', { name: 'Recent notifications' }))
      .toContainText(`Issue reported on order ${order.orderNumber} by ${buyerName}`);
    await admin.close();
  });

  test('an order can only be disputed once', async ({ page }) => {
    await signUpBuyer(page);
    const order = await placeOrder(page, 'COMPLETED');
    await page.goto(`/orders/${order.orderId}`);
    await page.getByRole('button', { name: 'Report issue' }).click();

    // Meanwhile a report arrives from elsewhere (another tab, a double submit).
    const first = await page.request.post('/api/v1/disputes', { data: { orderId: order.orderId, reason: 'Missing items' } });
    expect(first.status()).toBe(201);

    const dialog = page.getByRole('dialog', { name: 'Report an issue' });
    await dialog.getByLabel('What went wrong?').fill('Something else');
    await dialog.getByRole('button', { name: 'Submit report' }).click();

    await expect(page.getByText("You've already reported an issue with this order.")).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('region', { name: 'Issue reported' })).toContainText('Missing items');

    const again = await page.request.post('/api/v1/disputes', { data: { orderId: order.orderId, reason: 'Again' } });
    expect(again.status()).toBe(409);
    expect((await again.json()).code).toBe('ALREADY_DISPUTED');
  });

  test('orders that are not completed cannot be disputed', async ({ page }) => {
    await signUpBuyer(page);
    const order = await placeOrder(page, 'OUT_FOR_DELIVERY');

    await page.goto(`/orders/${order.orderId}`);
    await expect(status(page)).toContainText('Out for Delivery');
    await expect(page.getByRole('button', { name: 'Report issue' })).toHaveCount(0);

    const response = await page.request.post('/api/v1/disputes', { data: { orderId: order.orderId, reason: 'Late' } });
    expect(response.status()).toBe(422);
    expect((await response.json()).code).toBe('ORDER_NOT_COMPLETED');
  });

  test('the report form and a disputed order have no WCAG 2.1 AA violations', async ({ page }) => {
    await signUpBuyer(page);
    const order = await placeOrder(page, 'COMPLETED');
    await page.goto(`/orders/${order.orderId}`);
    await page.getByRole('button', { name: 'Report issue' }).click();
    await page.getByLabel('What went wrong?').fill('Wrong item delivered.');
    expect(await scanWcag(page, '[role="dialog"]')).toEqual([]);

    await page.getByRole('button', { name: 'Submit report' }).click();
    await expect(page.getByRole('region', { name: 'Issue reported' })).toBeVisible();
    expect(await scanWcag(page)).toEqual([]);
  });
});
