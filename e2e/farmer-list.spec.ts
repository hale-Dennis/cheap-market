import { expect, test, type Page } from '@playwright/test';

import { seedFarmers } from './support/api';
import { signInAsAdmin } from './support/session';

// Other specs add farmers to the same stub API concurrently, so these tests read
// totals from the page rather than assuming exact counts.
test.describe.configure({ mode: 'serial' });

const pagination = (page: Page) => page.getByRole('navigation', { name: 'Pagination' });
const dataRows = (page: Page) => page.locator('tbody tr');

async function totalPages(page: Page): Promise<number> {
  const text = await pagination(page).getByText(/^Page \d+ of \d+$/).innerText();
  return Number(/of (\d+)$/.exec(text)![1]);
}

test.describe('Farmer list', () => {
  let newestSeeded: string;

  test.beforeAll(async () => {
    const names = await seedFarmers(25);
    newestSeeded = names[names.length - 1];
  });

  test('admin reaches the Farmers page from the navigation and sees 20 farmers per page', async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Farmers' }).click();

    await expect(page).toHaveURL('/admin/farmers');
    await expect(page.getByRole('heading', { name: 'Farmers' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Region' })).toBeVisible();
    await expect(dataRows(page)).toHaveCount(20);
    await expect(page.getByRole('row', { name: new RegExp(newestSeeded) })).toContainText('Ashanti');
    await expect(pagination(page)).toContainText(/Showing 1–20 of \d+ farmers/);
    await expect(pagination(page).getByText('Previous')).toHaveAttribute('aria-disabled', 'true');
  });

  test('Next and Previous move between pages and update the URL', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/farmers');
    const firstPageNames = await dataRows(page).locator('td:first-child').allInnerTexts();

    await pagination(page).getByRole('link', { name: 'Next' }).click();

    await expect(page).toHaveURL('/admin/farmers?page=2');
    await expect(pagination(page)).toContainText(/Page 2 of \d+/);
    await expect(pagination(page)).toContainText(/Showing 21–\d+ of \d+ farmers/);
    const secondPageNames = await dataRows(page).locator('td:first-child').allInnerTexts();
    expect(secondPageNames.length).toBeGreaterThan(0);
    expect(secondPageNames.filter((name) => firstPageNames.includes(name))).toEqual([]);

    await pagination(page).getByRole('link', { name: 'Previous' }).click();

    await expect(page).toHaveURL('/admin/farmers');
    await expect(pagination(page)).toContainText(/Page 1 of \d+/);
  });

  test('a page beyond the end redirects to the last page', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/farmers');
    const lastPage = await totalPages(page);

    await page.goto('/admin/farmers?page=999');

    await expect(page).toHaveURL(`/admin/farmers?page=${lastPage}`);
    await expect(pagination(page).getByText('Next')).toHaveAttribute('aria-disabled', 'true');
  });

  test('an invalid page number shows the first page', async ({ page }) => {
    await signInAsAdmin(page);

    await page.goto('/admin/farmers?page=abc');

    await expect(pagination(page)).toContainText(/Page 1 of \d+/);
    await expect(dataRows(page)).toHaveCount(20);
  });
});
