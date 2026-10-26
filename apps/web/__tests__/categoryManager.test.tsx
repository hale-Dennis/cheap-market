import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import type { Category } from '@cheap-market/shared-types';

import { CategoryManager } from '../components/categories/CategoryManager';
import { ApiError } from '../services/apiClient';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../services/categoryService';

jest.mock('../services/categoryService', () => ({
  listCategories: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

const mocked = {
  list: listCategories as jest.MockedFunction<typeof listCategories>,
  create: createCategory as jest.MockedFunction<typeof createCategory>,
  update: updateCategory as jest.MockedFunction<typeof updateCategory>,
  remove: deleteCategory as jest.MockedFunction<typeof deleteCategory>,
};

const FRUITS: Category = { id: 'c-1', name: 'Fruits' };
const VEGETABLES: Category = { id: 'c-2', name: 'Vegetables' };

function renderManager() {
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <CategoryManager />
    </SWRConfig>,
  );
  return user;
}

describe('CategoryManager', () => {
  beforeEach(() => {
    Object.values(mocked).forEach((fn) => fn.mockReset());
  });

  it('lists categories with rename and delete actions', async () => {
    mocked.list.mockResolvedValue([FRUITS, VEGETABLES]);
    renderManager();

    const list = await screen.findByRole('list', { name: 'Produce categories (2)' });
    const cards = within(list).getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByRole('heading', { name: 'Fruits' })).toBeInTheDocument();
    expect(within(cards[0]).getByRole('button', { name: 'Rename Fruits' })).toBeInTheDocument();
    expect(within(cards[0]).getByRole('button', { name: 'Delete Fruits' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no categories', async () => {
    mocked.list.mockResolvedValue([]);
    renderManager();

    expect(await screen.findByRole('heading', { name: 'No categories yet' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('validates the name before adding', async () => {
    mocked.list.mockResolvedValue([]);
    const user = renderManager();
    await screen.findByText('No categories yet');

    await user.click(screen.getAllByRole('button', { name: 'Add category' })[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Add category' });
    await user.click(within(dialog).getByRole('button', { name: 'Add category' }));
    expect(await within(dialog).findByText('Category name is required.')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Name'), 'x'.repeat(51));
    await user.click(within(dialog).getByRole('button', { name: 'Add category' }));
    expect(
      await within(dialog).findByText('Category name must be at most 50 characters.'),
    ).toBeInTheDocument();
    expect(mocked.create).not.toHaveBeenCalled();
  });

  it('adds a category and refreshes the list', async () => {
    mocked.list.mockResolvedValueOnce([FRUITS]).mockResolvedValue([FRUITS, VEGETABLES]);
    mocked.create.mockResolvedValue(VEGETABLES);
    const user = renderManager();
    await screen.findByText('Fruits');

    await user.click(screen.getByRole('button', { name: 'Add category' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add category' });
    await user.type(within(dialog).getByLabelText('Name'), '  Vegetables ');
    await user.click(within(dialog).getByRole('button', { name: 'Add category' }));

    expect(mocked.create).toHaveBeenCalledWith({ name: 'Vegetables' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Vegetables')).toBeInTheDocument();
  });

  it('keeps the dialog open and shows a duplicate-name error from the API', async () => {
    mocked.list.mockResolvedValue([FRUITS]);
    mocked.create.mockRejectedValue(new ApiError('A category with this name already exists.', 409));
    const user = renderManager();
    await screen.findByText('Fruits');

    await user.click(screen.getByRole('button', { name: 'Add category' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add category' });
    await user.type(within(dialog).getByLabelText('Name'), 'fruits');
    await user.click(within(dialog).getByRole('button', { name: 'Add category' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'A category with this name already exists.',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renames a category from a pre-filled form', async () => {
    mocked.list.mockResolvedValueOnce([FRUITS]).mockResolvedValue([{ ...FRUITS, name: 'Fresh Fruits' }]);
    mocked.update.mockResolvedValue({ ...FRUITS, name: 'Fresh Fruits' });
    const user = renderManager();
    await screen.findByText('Fruits');

    await user.click(screen.getByRole('button', { name: 'Rename Fruits' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename category' });
    const input = within(dialog).getByLabelText('Name');
    expect(input).toHaveValue('Fruits');
    await user.clear(input);
    await user.type(input, 'Fresh Fruits');
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));

    expect(mocked.update).toHaveBeenCalledWith('c-1', { name: 'Fresh Fruits' });
    expect(await screen.findByText('Fresh Fruits')).toBeInTheDocument();
  });

  it('deletes a category after confirmation', async () => {
    mocked.list.mockResolvedValueOnce([FRUITS, VEGETABLES]).mockResolvedValue([VEGETABLES]);
    mocked.remove.mockResolvedValue(undefined);
    const user = renderManager();
    await screen.findByText('Fruits');

    await user.click(screen.getByRole('button', { name: 'Delete Fruits' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete “Fruits”?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(mocked.remove).toHaveBeenCalledWith('c-1');
    await waitFor(() => expect(screen.queryByText('Fruits')).not.toBeInTheDocument());
  });

  it('does nothing when deletion is cancelled', async () => {
    mocked.list.mockResolvedValue([FRUITS]);
    const user = renderManager();
    await screen.findByText('Fruits');

    await user.click(screen.getByRole('button', { name: 'Delete Fruits' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(mocked.remove).not.toHaveBeenCalled();
  });

  it('explains why a category in use cannot be deleted', async () => {
    mocked.list.mockResolvedValue([FRUITS]);
    mocked.remove.mockRejectedValue(
      new ApiError('This category is used by produce listings and cannot be deleted.', 409),
    );
    const user = renderManager();
    await screen.findByText('Fruits');

    await user.click(screen.getByRole('button', { name: 'Delete Fruits' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'This category is used by produce listings and cannot be deleted.',
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
