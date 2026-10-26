import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import { scanWcag } from './support/a11y';

import { seedCategory, seedFarmer, seedListing, seedPickupLocation } from './support/api';
import { signInAsAdmin } from './support/session';

// This spec owns the AHAFO region in the shared stub. Each test signs up its own buyer.
test.describe.configure({ mode: 'serial' });

test.describe('Placing an order', () => {
  const id = randomUUID().slice(0, 6);
  const product = `Plantain ${id}`;
  const pickup = `Goaso Market ${id}`;
  let productId: string;

  test.beforeAll(async () => {
    const farmer = await seedFarmer(`Ahafo Farmer ${id}`, 'AHAFO');
    const category = await seedCategory(`Orders ${id}`);
    productId = (await seedListing({ farmerId: farmer.id, categoryId: category.id, name: product, priceCents: 1500 })).id;
    await seedPickupLocation(pickup, 'AHAFO');
  });

  async function buyerWithCart(page: Page, quantity = 3) {
    const buyerName = `Order Buyer ${randomUUID().slice(0, 4)}`;
    await page.goto('/signup');
    await page.getByLabel('Full name').fill(buyerName);
    await page.getByLabel('Email').fill(`order.${randomUUID().slice(0, 8)}@example.com`);
    await page.getByLabel('Home region').selectOption({ label: 'Ahafo' });
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByLabel('Confirm password').fill('Password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/buyer/profile');
    await page.getByLabel('Street address').fill('3 Station Rd');
    await page.getByLabel('Town / city').fill('Goaso');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Your profile has been saved.')).toBeVisible();
    await page.goto(`/products/${productId}`);
    await page.getByLabel('Quantity').fill(String(quantity));
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByText(/^Added/)).toBeVisible();
    return buyerName;
  }

  test('buyer places a pickup order, sees the confirmation, and the admin is notified', async ({ page, browser }) => {
    const buyerName = await buyerWithCart(page);
    await page.goto('/checkout');
    await page.getByLabel(/Collect from a pickup point/).check();
    await page.getByLabel('Pickup point', { exact: true }).selectOption({ label: pickup });
    await page.getByRole('button', { name: 'Place order' }).click();

    await expect(page).toHaveURL(/\/orders\/confirmation\?orderId=[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { name: 'Thank you! Your order is placed.' })).toBeVisible();
    const orderNumber = (await page.getByText(/^CM-[0-9A-Z]{8}$/).innerText()).trim();
    // The current step of the order's status track.
    await expect(page.getByRole('list', { name: 'Order progress' }).locator('[aria-current="step"]')).toContainText('Pending');
    await expect(page.getByText(`Collect from ${pickup}`)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Items' })).toContainText(`${product} × 3`);
    await expect(page.getByRole('region', { name: 'Items' }).getByText('Total', { exact: true }).locator('xpath=following-sibling::dd')).toHaveText('GH₵ 45.00');
    // The cart was emptied.
    await expect(page.getByRole('link', { name: /^Cart · 0/ })).toBeVisible();

    // The confirmation survives a reload (it's loaded from the API by order id).
    await page.reload();
    await expect(page.getByText(orderNumber)).toBeVisible();

    // The admin sees a notification on the dashboard.
    const admin = await browser.newPage();
    await signInAsAdmin(admin);
    const notifications = admin.getByRole('list', { name: 'Recent notifications' });
    await expect(notifications).toContainText(`New order ${orderNumber} from ${buyerName}`);
    await admin.close();
  });

  test('home delivery adds the delivery fee to the order', async ({ page }) => {
    await buyerWithCart(page, 2);
    await page.goto('/checkout');
    await page.getByLabel(/Home delivery/).check();
    await page.getByRole('button', { name: 'Place order' }).click();

    await expect(page.getByRole('heading', { name: 'Thank you! Your order is placed.' })).toBeVisible();
    await expect(page.getByText('3 Station Rd, Goaso')).toBeVisible();
    const items = page.getByRole('region', { name: 'Items' });
    await expect(items.getByText('Delivery', { exact: true }).locator('xpath=following-sibling::dd')).toHaveText('GH₵ 10.00');
    await expect(items.getByText('Total', { exact: true }).locator('xpath=following-sibling::dd')).toHaveText('GH₵ 40.00');
  });

  test('a repeated request with the same idempotency key returns the same order', async ({ page }) => {
    await buyerWithCart(page, 1);
    const key = `e2e-${randomUUID()}`;
    const send = () =>
      page.request.post('/api/v1/orders', {
        headers: { 'Idempotency-Key': key, 'Content-Type': 'application/json' },
        data: { fulfillmentType: 'DELIVERY' },
      });

    const first = await send();
    const second = await send();

    expect(first.status()).toBe(201);
    expect(second.status()).toBe(200);
    const [a, b] = [(await first.json()).data, (await second.json()).data];
    expect(b).toEqual({ ...a, duplicate: true });
  });

  test('ordering with an empty cart is refused with EMPTY_CART', async ({ page }) => {
    await buyerWithCart(page, 1);
    await page.request.delete('/api/v1/cart');

    const response = await page.request.post('/api/v1/orders', {
      headers: { 'Idempotency-Key': `e2e-${randomUUID()}`, 'Content-Type': 'application/json' },
      data: { fulfillmentType: 'DELIVERY' },
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).code).toBe('EMPTY_CART');
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  });

  test('the confirmation page has no WCAG 2.1 AA violations', async ({ page }) => {
    await buyerWithCart(page, 1);
    await page.goto('/checkout');
    await page.getByLabel(/Home delivery/).check();
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page.getByRole('heading', { name: 'Thank you! Your order is placed.' })).toBeVisible();

    expect(await scanWcag(page)).toEqual([]);
  });
});
