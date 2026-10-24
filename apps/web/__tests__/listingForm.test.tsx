import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AdminProduct, Category, Farmer } from '@cheap-market/shared-types';

import { ListingForm } from '../components/listings/ListingForm';
import { today } from '../lib/validation/listing';
import { ApiError } from '../services/apiClient';
import { createProduct, uploadListingImages } from '../services/productService';

jest.mock('../services/productService', () => ({
  uploadListingImages: jest.fn(),
  createProduct: jest.fn(),
}));

const mockedUpload = uploadListingImages as jest.MockedFunction<typeof uploadListingImages>;
const mockedCreate = createProduct as jest.MockedFunction<typeof createProduct>;

const FARMER: Farmer = {
  id: 'f-1',
  fullName: 'Ama Mensah',
  email: null,
  phoneNumber: '+233241234567',
  region: 'ASHANTI',
  accountStatus: 'ACTIVE',
  createdAt: '2026-10-01T00:00:00Z',
};
const CATEGORY: Category = { id: 'c-1', name: 'Vegetables' };

const LISTING: AdminProduct = {
  id: 'p-1',
  farmerId: 'f-1',
  categoryId: 'c-1',
  name: 'Organic Tomatoes',
  description: null,
  priceCents: 1550,
  unit: 'per kg',
  harvestDate: '2026-10-23',
  stockQuantity: 0,
  imageUrls: ['/api/v1/media/a.jpg'],
  listingStatus: 'ACTIVE',
  createdAt: '2026-10-24T00:00:00Z',
};

/** The hidden native input behind the "Add photos" button. */
const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;

const image = (name = 'tomato.jpg', type = 'image/jpeg', size = 1024) =>
  new File([new Uint8Array(size)], name, { type });

beforeAll(() => {
  // jsdom has no object URLs; previews only need a string.
  URL.createObjectURL = jest.fn(() => 'blob:preview');
  URL.revokeObjectURL = jest.fn();
});

function renderForm() {
  const onCreated = jest.fn();
  // applyAccept: false lets tests pick files the input's `accept` would hide, as drag-and-drop can.
  const user = userEvent.setup({ applyAccept: false });
  render(<ListingForm farmers={[FARMER]} categories={[CATEGORY]} onCreated={onCreated} />);
  return { onCreated, user };
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText('Farmer'), 'f-1');
  await user.selectOptions(screen.getByLabelText('Category'), 'c-1');
  await user.type(screen.getByLabelText('Produce name'), 'Organic Tomatoes');
  await user.type(screen.getByLabelText('Description (optional)'), 'Grown without pesticides.');
  await user.type(screen.getByLabelText('Price (GH₵)'), '15.5');
  await user.selectOptions(screen.getByLabelText('Unit'), 'per kg');
  await user.type(screen.getByLabelText('Harvest date'), today());
  await user.upload(fileInput(), [image('one.jpg'), image('two.png', 'image/png')]);
}

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Create listing' }));

describe('ListingForm', () => {
  beforeEach(() => {
    mockedUpload.mockReset();
    mockedCreate.mockReset();
  });

  it('lists farmers with their region and the categories', () => {
    renderForm();

    expect(screen.getByRole('option', { name: 'Ama Mensah — Ashanti' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Vegetables' })).toBeInTheDocument();
  });

  it('requires every field except the description', async () => {
    const { user } = renderForm();

    await submit(user);

    expect(await screen.findByText('Select the farmer selling this produce.')).toBeInTheDocument();
    expect(screen.getByText('Select a category.')).toBeInTheDocument();
    expect(screen.getByText('Produce name is required.')).toBeInTheDocument();
    expect(screen.getByText('Price is required.')).toBeInTheDocument();
    expect(screen.getByText('Select a unit.')).toBeInTheDocument();
    expect(screen.getByText('Harvest date is required.')).toBeInTheDocument();
    expect(screen.getByText('Add at least one photo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (optional)')).not.toHaveAttribute('aria-invalid', 'true');
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it.each([
    ['0', 'Price must be greater than zero.'],
    ['-5', 'Enter a price like 15 or 15.50.'],
    ['15.555', 'Enter a price like 15 or 15.50.'],
    ['abc', 'Enter a price like 15 or 15.50.'],
  ])('rejects the price %p', async (price, message) => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText('Price (GH₵)'), price);
    await submit(user);

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('rejects a harvest date in the future', async () => {
    const { user } = renderForm();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await user.type(screen.getByLabelText('Harvest date'), tomorrow.toLocaleDateString('en-CA'));
    await submit(user);

    expect(await screen.findByText('Harvest date cannot be in the future.')).toBeInTheDocument();
  });

  it('rejects files that are not JPEG/PNG or are over 2 MB, keeping valid ones', async () => {
    const { user } = renderForm();

    await user.upload(fileInput(), [
      image('ok.jpg'),
      image('anim.gif', 'image/gif'),
      image('huge.png', 'image/png', 2 * 1024 * 1024 + 1),
    ]);

    expect(screen.getByText('"anim.gif" must be a JPEG or PNG image.')).toBeInTheDocument();
    expect(screen.getByText('"huge.png" is larger than 2 MB.')).toBeInTheDocument();
    const photos = screen.getByRole('list', { name: 'Selected photos' });
    expect(within(photos).getAllByRole('img')).toHaveLength(1);
    expect(within(photos).getByText('Main photo')).toBeInTheDocument();
  });

  it('exposes a single labelled control for adding photos', () => {
    renderForm();

    const button = screen.getByRole('button', { name: 'Add photos' });
    expect(button).toHaveAttribute('aria-describedby', 'images-hint');
    expect(fileInput()).toHaveAttribute('tabindex', '-1');
    expect(fileInput()).toHaveAttribute('aria-hidden', 'true');
  });

  it('stops at 5 photos', async () => {
    const { user } = renderForm();

    await user.upload(
      fileInput(),
      Array.from({ length: 6 }, (_, i) => image(`p${i}.jpg`)),
    );

    expect(within(screen.getByRole('list', { name: 'Selected photos' })).getAllByRole('img')).toHaveLength(5);
    expect(screen.getByText('A listing can have at most 5 photos; 1 not added.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add more photos' })).toBeDisabled();
  });

  it('removes a selected photo', async () => {
    const { user } = renderForm();
    await user.upload(fileInput(), [image('a.jpg'), image('b.jpg')]);

    await user.click(screen.getByRole('button', { name: 'Remove a.jpg' }));

    const photos = screen.getByRole('list', { name: 'Selected photos' });
    expect(within(photos).getAllByRole('img')).toHaveLength(1);
    expect(within(photos).getByAltText('Preview of b.jpg')).toBeInTheDocument();
  });

  it('uploads the photos, then creates the listing with the price in pesewas', async () => {
    mockedUpload.mockResolvedValue(['/api/v1/media/a.jpg', '/api/v1/media/b.png']);
    mockedCreate.mockResolvedValue(LISTING);
    const { user, onCreated } = renderForm();

    await fillValid(user);
    await submit(user);

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(LISTING, FARMER));
    const [farmerId, files] = mockedUpload.mock.calls[0];
    expect(farmerId).toBe('f-1');
    expect(files.map((f) => f.name)).toEqual(['one.jpg', 'two.png']);
    expect(mockedCreate).toHaveBeenCalledWith({
      farmerId: 'f-1',
      categoryId: 'c-1',
      name: 'Organic Tomatoes',
      description: 'Grown without pesticides.',
      priceCents: 1550,
      unit: 'per kg',
      harvestDate: today(),
      imageUrls: ['/api/v1/media/a.jpg', '/api/v1/media/b.png'],
    });
    // Ready for the next listing, still for the same farmer.
    expect(screen.getByLabelText('Produce name')).toHaveValue('');
    expect(screen.getByLabelText('Farmer')).toHaveValue('f-1');
    expect(screen.queryByRole('list', { name: 'Selected photos' })).not.toBeInTheDocument();
  });

  it('shows the API error and does not create the listing when the upload fails', async () => {
    mockedUpload.mockRejectedValue(new ApiError('"one.jpg" must be a JPEG or PNG image.', 400));
    const { user, onCreated } = renderForm();

    await fillValid(user);
    await submit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('"one.jpg" must be a JPEG or PNG image.');
    expect(mockedCreate).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Create listing' })).toBeEnabled();
  });
});
