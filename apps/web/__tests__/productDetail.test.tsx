import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import type { Cart, FarmerSummary } from '@cheap-market/shared-types';

import { PLACEHOLDER_IMAGE } from '../components/catalog/ProductCard';
import { AddToCart } from '../components/product/AddToCart';
import { FarmerInfo } from '../components/product/FarmerInfo';
import { ProductGallery } from '../components/product/ProductGallery';
import { PublicLayout } from '../components/PublicLayout';
import { imageSrcSet, sizedImageUrl } from '../lib/image';
import { ApiError } from '../services/apiClient';
import { getCart, setCartItem } from '../services/cartService';

jest.mock('../services/cartService', () => ({ getCart: jest.fn(), setCartItem: jest.fn() }));
jest.mock('next/router', () => ({ useRouter: () => ({ replace: jest.fn(), pathname: '/products/p-1' }) }));

const mockedGetCart = getCart as jest.MockedFunction<typeof getCart>;
const mockedSetCartItem = setCartItem as jest.MockedFunction<typeof setCartItem>;

const cart = (totalItems: number): Cart => ({ items: [], totalItems, subtotalCents: 0 });

/** The header cart badge, whose text spans several elements ("Cart · 3" + " items"). */
const cartBadge = (text: string) =>
  screen.findByText((_, element) => element?.tagName === 'SPAN' && element.textContent === text);

describe('image helpers', () => {
  const cloudinary = 'https://res.cloudinary.com/demo/image/upload/v1/cheap-market/farmers/f/a.jpg';

  it('asks Cloudinary for a resized, auto-format image', () => {
    expect(sizedImageUrl(cloudinary, 800)).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_800/v1/cheap-market/farmers/f/a.jpg',
    );
    expect(imageSrcSet(cloudinary, [400, 800])).toContain('w_400/v1/cheap-market/farmers/f/a.jpg 400w');
  });

  it('leaves local images unchanged', () => {
    expect(sizedImageUrl('/api/v1/media/a.jpg', 800)).toBe('/api/v1/media/a.jpg');
    expect(imageSrcSet('/api/v1/media/a.jpg', [400])).toBeUndefined();
  });
});

describe('ProductGallery', () => {
  const photos = ['/api/v1/media/1.jpg', '/api/v1/media/2.jpg', '/api/v1/media/3.jpg'];

  it('shows the first photo and moves with next, previous (wrapping) and thumbnails', async () => {
    const user = userEvent.setup();
    render(<ProductGallery name="Tomatoes" imageUrls={photos} />);

    const main = () => screen.getByRole('img', { name: /Tomatoes, photo/ });
    expect(main()).toHaveAttribute('src', photos[0]);
    expect(main()).toHaveAccessibleName('Tomatoes, photo 1 of 3');

    await user.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(main()).toHaveAttribute('src', photos[1]);

    await user.click(screen.getByRole('button', { name: 'Previous photo' }));
    await user.click(screen.getByRole('button', { name: 'Previous photo' }));
    expect(main()).toHaveAttribute('src', photos[2]);

    await user.click(screen.getByRole('button', { name: 'Show photo 2 of 3' }));
    expect(main()).toHaveAttribute('src', photos[1]);
    expect(screen.getByRole('button', { name: 'Show photo 2 of 3' })).toHaveAttribute('aria-current', 'true');
  });

  it('supports the arrow keys', async () => {
    const user = userEvent.setup();
    render(<ProductGallery name="Tomatoes" imageUrls={photos} />);

    await user.click(screen.getByRole('button', { name: 'Show photo 1 of 3' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('img', { name: 'Tomatoes, photo 2 of 3' })).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('img', { name: 'Tomatoes, photo 3 of 3' })).toBeInTheDocument();
  });

  it('shows a single photo without navigation', () => {
    render(<ProductGallery name="Tomatoes" imageUrls={[photos[0]]} />);

    expect(screen.getByRole('img', { name: 'Tomatoes' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('falls back to the placeholder when there are no photos', () => {
    render(<ProductGallery name="Tomatoes" imageUrls={[]} />);

    expect(screen.getByRole('img', { name: 'No photo of Tomatoes' })).toHaveAttribute('src', PLACEHOLDER_IMAGE);
  });
});

describe('FarmerInfo', () => {
  const farmer = (overrides: Partial<FarmerSummary> = {}): FarmerSummary => ({
    fullName: 'Ama Mensah',
    region: 'ASHANTI',
    averageRating: 4.46,
    ratingCount: 12,
    ...overrides,
  });

  it('shows the farmer, region and star rating', () => {
    render(<FarmerInfo farmer={farmer()} />);

    expect(screen.getByText('Ama Mensah')).toBeInTheDocument();
    expect(screen.getByText('Ashanti region')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText(/out of 5/)).toHaveClass('sr-only');
    expect(screen.getByText('(12 ratings)')).toBeInTheDocument();
  });

  it.each([
    [{ ratingCount: 0, averageRating: 0 }],
    [{ ratingCount: null, averageRating: null }],
  ])('shows "No ratings yet" when unrated (%p)', (overrides) => {
    render(<FarmerInfo farmer={farmer(overrides)} />);

    expect(screen.getByText('No ratings yet')).toBeInTheDocument();
    expect(screen.queryByText(/out of 5/)).not.toBeInTheDocument();
  });
});

describe('AddToCart', () => {
  beforeEach(() => {
    mockedGetCart.mockReset();
    mockedSetCartItem.mockReset();
  });

  function renderWithLayout(role: 'BUYER' | 'ADMIN' | null) {
    const user = userEvent.setup();
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <PublicLayout title="Okro" session={role ? { email: 'jane@example.com', role } : null}>
          <AddToCart productId="p-1" productName="Okro" unit="per basket" viewerRole={role} />
        </PublicLayout>
      </SWRConfig>,
    );
    return user;
  }

  it('invites visitors to sign in, returning to the product afterwards', () => {
    renderWithLayout(null);

    expect(screen.getByRole('link', { name: 'Sign in to add to cart' })).toHaveAttribute(
      'href',
      '/login?next=%2Fproducts%2Fp-1',
    );
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/signup?next=%2Fproducts%2Fp-1',
    );
    expect(mockedGetCart).not.toHaveBeenCalled();
  });

  it('explains that admins cannot buy', () => {
    renderWithLayout('ADMIN');

    expect(screen.getByText('Only buyer accounts can add produce to a cart.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add to cart' })).not.toBeInTheDocument();
  });

  it('shows no count until the cart has loaded', () => {
    mockedGetCart.mockReturnValue(new Promise(() => {}));
    renderWithLayout('BUYER');

    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(screen.queryByText(/Cart · /)).not.toBeInTheDocument();
  });

  it('adds the chosen quantity and updates the cart count in the header', async () => {
    mockedGetCart.mockResolvedValue(cart(0));
    mockedSetCartItem.mockResolvedValue(cart(3));
    const user = renderWithLayout('BUYER');
    expect(await cartBadge('Cart · 0 items')).toBeInTheDocument();

    const quantity = screen.getByLabelText('Quantity');
    await user.clear(quantity);
    await user.type(quantity, '3');
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(mockedSetCartItem).toHaveBeenCalledWith({ productId: 'p-1', quantity: 3 });
    expect(await cartBadge('Cart · 3 items')).toBeInTheDocument();
  });

  it.each(['0', '100', '1.5'])('rejects the quantity %p', async (value) => {
    mockedGetCart.mockResolvedValue(cart(0));
    const user = renderWithLayout('BUYER');

    const quantity = screen.getByLabelText('Quantity');
    await user.clear(quantity);
    await user.type(quantity, value);
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a quantity from 1 to 99.');
    expect(mockedSetCartItem).not.toHaveBeenCalled();
  });

  it('shows the API error when the product can no longer be added', async () => {
    mockedGetCart.mockResolvedValue(cart(0));
    mockedSetCartItem.mockRejectedValue(
      new ApiError('Product is not active and cannot be added to the cart.', 422),
    );
    const user = renderWithLayout('BUYER');

    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    await waitFor(() =>
      expect(within(screen.getByRole('main')).getByRole('alert')).toHaveTextContent(
        'Product is not active and cannot be added to the cart.',
      ),
    );
  });
});
