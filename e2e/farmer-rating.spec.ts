import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import { scanWcag } from './support/a11y';

import { seedCategory, seedFarmer, seedListing, setOrderStatus } from './support/api';

// This spec owns the OTI region in the shared stub. Each test signs up its own buyer.
test.describe.configure({ mode: 'serial' });

test.describe('Rating farmers', () => {
  const id = randomUUID().slice(0, 6);
  const kofi = `Kofi Oti ${id}`;
  const ama = `Ama Oti ${id}`;
  let yamId: string;
  let okroId: string;

  test.beforeAll(async () => {
    const category = await seedCategory(`Ratings ${id}`);
    const kofiFarmer = await seedFarmer(kofi, 'OTI');
    const amaFarmer = await seedFarmer(ama, 'OTI');
    yamId = (await seedListing({ farmerId: kofiFarmer.id, categoryId: category.id, name: `Yam ${id}`, priceCents: 2000 })).id;
    okroId = (await seedListing({ farmerId: amaFarmer.id, categoryId: category.id, name: `Okro ${id}`, priceCents: 1500 })).id;
  });

  async function signUpBuyer(page: Page) {
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Rating Buyer');
    await page.getByLabel('Email').fill(`rating.${randomUUID().slice(0, 8)}@example.com`);
    await page.getByLabel('Home region').selectOption({ label: 'Oti' });
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByLabel('Confirm password').fill('Password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/buyer/profile');
    await page.getByLabel('Street address').fill('3 Station Rd');
    await page.getByLabel('Town / city').fill('Dambai');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Your profile has been saved.')).toBeVisible();
  }

  /** Places a delivery order for yam (Kofi) and okro (Ama) through the API, as the checkout does. */
  async function placeOrder(page: Page, status: string) {
    await page.request.post('/api/v1/cart', { data: { productId: yamId, quantity: 1 } });
    await page.request.post('/api/v1/cart', { data: { productId: okroId, quantity: 2 } });
    const response = await page.request.post('/api/v1/orders', {
      headers: { 'Idempotency-Key': `e2e-${randomUUID()}` },
      data: { fulfillmentType: 'DELIVERY' },
    });
    expect(response.status()).toBe(201);
    const order = (await response.json()).data as { orderId: string; orderNumber: string };
    await setOrderStatus(order.orderId, status);
    return order;
  }

  const row = (page: Page, orderNumber: string) =>
    page.getByRole('list', { name: 'Your orders' }).getByRole('listitem').filter({ hasText: orderNumber });

  /** Clicks the visible star, as a buyer would (the radio and its name are screen-reader only). */
  const star = (dialog: ReturnType<Page['getByRole']>, stars: number) =>
    dialog.locator('label').filter({ has: dialog.page().getByRole('radio', { name: `${stars} ${stars === 1 ? 'star' : 'stars'}` }) });

  async function rate(page: Page, farmer: string, stars: number, comment?: string) {
    await page.getByRole('button', { name: `Rate ${farmer}` }).click();
    const dialog = page.getByRole('dialog', { name: `Rate ${farmer}` });
    await expect(dialog.getByRole('button', { name: 'Submit rating' })).toBeDisabled();
    await star(dialog, stars).click();
    await expect(dialog.getByRole('radio', { name: `${stars} ${stars === 1 ? 'star' : 'stars'}` })).toBeChecked();
    if (comment) await dialog.getByLabel('Comment (optional)').fill(comment);
    await dialog.getByRole('button', { name: 'Submit rating' }).click();
  }

  test('a buyer rates each farmer of a completed order once, and the rating reaches the farmer’s profile', async ({ page }) => {
    await signUpBuyer(page);
    const order = await placeOrder(page, 'COMPLETED');

    await page.goto('/orders');
    await expect(row(page, order.orderNumber).getByRole('button', { name: `Rate ${kofi}` })).toBeVisible();
    await expect(row(page, order.orderNumber).getByRole('button', { name: `Rate ${ama}` })).toBeVisible();

    await rate(page, kofi, 4, 'Big, sweet yams');

    await expect(page.getByText(`Thanks! You rated ${kofi} 4 out of 5.`)).toBeVisible();
    await expect(page.getByRole('button', { name: `Rate ${kofi}` })).toHaveCount(0);
    await expect(row(page, order.orderNumber).getByRole('button', { name: `Rate ${ama}` })).toBeVisible();

    // The order page shows the rating, and Ama can still be rated there.
    await row(page, order.orderNumber).getByRole('link').click();
    const farmersSection = page.getByRole('region', { name: 'Rate your farmers' });
    await expect(farmersSection.getByRole('listitem').filter({ hasText: kofi })).toContainText('You rated 4 out of 5');
    await expect(farmersSection.getByRole('listitem').filter({ hasText: kofi })).toContainText('“Big, sweet yams”');
    await rate(page, ama, 5);
    await expect(farmersSection.getByRole('listitem').filter({ hasText: ama })).toContainText('You rated 5 out of 5');
    await expect(farmersSection.getByRole('button')).toHaveCount(0);

    // The rating counts towards the farmer's average on their products.
    await page.goto(`/products/${yamId}`);
    await expect(page.getByRole('region', { name: 'Farmer' })).toContainText('4.0 out of 5 (1 rating)');
  });

  test('a second rating for the same farmer and order is blocked', async ({ page }) => {
    await signUpBuyer(page);
    const order = await placeOrder(page, 'COMPLETED');
    await page.goto(`/orders/${order.orderId}`);
    await page.getByRole('button', { name: `Rate ${kofi}` }).click();

    // Meanwhile the same rating arrives from elsewhere (another tab, a double submit).
    const farmerId = await (await page.request.get(`/api/v1/orders/${order.orderId}`)).json()
      .then((body) => body.data.farmers.find((f: { fullName: string }) => f.fullName === kofi).farmerId);
    const first = await page.request.post('/api/v1/ratings', { data: { orderId: order.orderId, farmerId, score: 2 } });
    expect(first.status()).toBe(201);

    const dialog = page.getByRole('dialog', { name: `Rate ${kofi}` });
    await star(dialog, 5).click();
    await dialog.getByRole('button', { name: 'Submit rating' }).click();

    await expect(page.getByText("You've already rated this farmer for this order.")).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('region', { name: 'Rate your farmers' }).getByRole('listitem').filter({ hasText: kofi }))
      .toContainText('You rated 2 out of 5');

    const again = await page.request.post('/api/v1/ratings', { data: { orderId: order.orderId, farmerId, score: 5 } });
    expect(again.status()).toBe(409);
    expect((await again.json()).code).toBe('ALREADY_RATED');
  });

  test('orders that are not completed cannot be rated', async ({ page }) => {
    await signUpBuyer(page);
    const order = await placeOrder(page, 'OUT_FOR_DELIVERY');

    await page.goto('/orders');
    await expect(row(page, order.orderNumber)).toContainText('Out for Delivery');
    await expect(row(page, order.orderNumber).getByRole('button')).toHaveCount(0);
    await row(page, order.orderNumber).getByRole('link').click();
    await expect(page.getByRole('heading', { name: `Order ${order.orderNumber}` })).toBeVisible();
    await expect(page.getByRole('region', { name: /Rate your/ })).toHaveCount(0);

    const farmerId = (await (await page.request.get(`/api/v1/orders/${order.orderId}`)).json()).data.farmers[0].farmerId;
    const response = await page.request.post('/api/v1/ratings', { data: { orderId: order.orderId, farmerId, score: 5 } });
    expect(response.status()).toBe(422);
    expect((await response.json()).code).toBe('ORDER_NOT_COMPLETED');
  });

  test('the rating dialog has no WCAG 2.1 AA violations', async ({ page }) => {
    await signUpBuyer(page);
    await placeOrder(page, 'COMPLETED');
    await page.goto('/orders');
    await page.getByRole('button', { name: `Rate ${kofi}` }).click();
    await star(page.getByRole('dialog'), 3).click();

    expect(await scanWcag(page, '[role="dialog"]')).toEqual([]);
  });
});
