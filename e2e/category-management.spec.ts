import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import { scanWcag } from './support/a11y';

import { signInAsAdmin } from './support/session';

// Tests share one stub API process, so every category name is unique.
const uniqueName = (label: string) => `${label} ${randomUUID().slice(0, 6)}`;

async function addCategory(page: Page, name: string) {
  await page.getByRole('button', { name: 'Add category' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add category' });
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByRole('button', { name: 'Add category' }).click();
  await expect(dialog).toBeHidden();
}

// Each category is a card in the "Produce categories" list, headed by its name.
const row = (page: Page, name: string) =>
  page
    .getByRole('list', { name: /^Produce categories/ })
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });

test.describe('Category management', () => {
  test('admin opens Categories from the dashboard and adds, renames and deletes a category', async ({
    page,
  }) => {
    const name = uniqueName('Vegetables');
    const renamed = uniqueName('Leafy Greens');
    await signInAsAdmin(page);

    await page.getByRole('link', { name: 'Manage categories' }).click();
    await expect(page).toHaveURL('/admin/categories');
    await expect(page.getByRole('heading', { name: 'Categories', level: 1 })).toBeVisible();

    // Add
    await addCategory(page, name);
    await expect(page.getByText(`Category "${name}" added.`)).toBeVisible();
    await expect(row(page, name)).toBeVisible();

    // Persisted: still there after a reload
    await page.reload();
    await expect(row(page, name)).toBeVisible();

    // Rename
    await page.getByRole('button', { name: `Rename ${name}` }).click();
    const editDialog = page.getByRole('dialog', { name: 'Rename category' });
    await expect(editDialog.getByLabel('Name')).toHaveValue(name);
    await editDialog.getByLabel('Name').fill(renamed);
    await editDialog.getByRole('button', { name: 'Save name' }).click();
    await expect(page.getByText(`Category renamed to "${renamed}".`)).toBeVisible();
    await expect(row(page, renamed)).toBeVisible();
    await expect(row(page, name)).toHaveCount(0);

    // Delete
    await page.getByRole('button', { name: `Delete ${renamed}` }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText(`Delete “${renamed}”?`);
    await confirm.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText(`Category "${renamed}" deleted.`)).toBeVisible();
    await expect(row(page, renamed)).toHaveCount(0);
  });

  test('rejects a duplicate name regardless of letter case', async ({ page }) => {
    const name = uniqueName('Fruits');
    await signInAsAdmin(page);
    await page.goto('/admin/categories');
    await addCategory(page, name);

    await page.getByRole('button', { name: 'Add category' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Add category' });
    await dialog.getByLabel('Name').fill(name.toUpperCase());
    await dialog.getByRole('button', { name: 'Add category' }).click();

    await expect(
      dialog.getByRole('alert').filter({ hasText: 'A category with this name already exists.' }),
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('validates the name in the form', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/categories');

    await page.getByRole('button', { name: 'Add category' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Add category' });
    await dialog.getByRole('button', { name: 'Add category' }).click();
    await expect(dialog.getByText('Category name is required.')).toBeVisible();

    await dialog.getByLabel('Name').fill('x'.repeat(51));
    await dialog.getByRole('button', { name: 'Add category' }).click();
    await expect(dialog.getByText('Category name must be at most 50 characters.')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('the page and the add dialog have no WCAG 2.1 AA violations', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/categories');
    await addCategory(page, uniqueName('Grains'));
    // Scan with the success toast showing, once its entrance transition has finished.
    await expect(page.getByText(/Category ".+" added\./)).toBeVisible();
    expect(await scanWcag(page)).toEqual([]);

    await page.getByRole('button', { name: 'Add category' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await scanWcag(page, '[role="dialog"]')).toEqual([]);
  });
});
