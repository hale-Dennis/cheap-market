import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import type { Category, PaginatedResponse, ProductCard as ProductCardData } from '@cheap-market/shared-types';

import { CatalogView, type CatalogFilters } from '../components/catalog/CatalogView';
import { PLACEHOLDER_IMAGE, ProductCard } from '../components/catalog/ProductCard';
import { formatCedis, harvestedAgo } from '../lib/format';
import { parseRegion, serializeRegionCookie } from '../lib/region';
import { listCatalogProducts, listPublicCategories } from '../services/catalogService';

jest.mock('../services/catalogService', () => ({
  listCatalogProducts: jest.fn(),
  listPublicCategories: jest.fn(),
}));

const mockedList = listCatalogProducts as jest.MockedFunction<typeof listCatalogProducts>;
const mockedCategories = listPublicCategories as jest.MockedFunction<typeof listPublicCategories>;

const today = new Date().toLocaleDateString('en-CA');

function card(index: number, overrides: Partial<ProductCardData> = {}): ProductCardData {
  return {
    id: `p-${index}`,
    name: `Produce ${index}`,
    priceCents: 1850,
    unit: 'per kg',
    primaryImageUrl: `/api/v1/media/${index}.jpg`,
    harvestDate: today,
    farmerName: 'Ama Mensah',
    categoryName: 'Vegetables',
    ...overrides,
  };
}

function page(content: ProductCardData[], totalElements = content.length): PaginatedResponse<ProductCardData> {
  return { content, currentPage: 0, totalPages: Math.ceil(totalElements / 20), totalElements, size: 20 };
}

const CATEGORIES: Category[] = [
  { id: 'c-veg', name: 'Vegetables' },
  { id: 'c-fruit', name: 'Fruits' },
];

describe('formatting', () => {
  it('formats pesewas as cedis', () => {
    expect(formatCedis(1850)).toBe('GH₵ 18.50');
    expect(formatCedis(185000)).toBe('GH₵ 1,850.00');
    expect(formatCedis(5)).toBe('GH₵ 0.05');
  });

  it('describes how long ago produce was harvested', () => {
    const now = new Date(2026, 9, 24, 18, 0);
    expect(harvestedAgo('2026-10-24', now)).toBe('Harvested today');
    expect(harvestedAgo('2026-10-23', now)).toBe('Harvested yesterday');
    expect(harvestedAgo('2026-10-20', now)).toBe('Harvested 4 days ago');
  });

  it('parses and serialises the region cookie', () => {
    expect(parseRegion('VOLTA')).toBe('VOLTA');
    expect(parseRegion('Volta')).toBeNull();
    expect(parseRegion(undefined)).toBeNull();
    expect(serializeRegionCookie('VOLTA')).toContain('cm_region=VOLTA; Path=/;');
  });
});

describe('ProductCard', () => {
  it('shows name, price with unit, category, freshness and farmer, and links to the detail page', () => {
    render(<ProductCard product={card(1)} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/p-1');
    expect(within(link).getByRole('heading', { name: 'Produce 1' })).toBeInTheDocument();
    expect(link).toHaveTextContent('GH₵ 18.50 per kg');
    expect(link).toHaveTextContent('Vegetables');
    expect(link).toHaveTextContent('Harvested today · Ama Mensah');
    const img = within(link).getByRole('img', { name: 'Produce 1' });
    expect(img).toHaveAttribute('src', '/api/v1/media/1.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('falls back to a placeholder when the listing has no photo', () => {
    render(<ProductCard product={card(2, { primaryImageUrl: null })} />);

    const img = screen.getByRole('img', { name: 'No photo of Produce 2' });
    expect(img).toHaveAttribute('src', PLACEHOLDER_IMAGE);
  });
});

describe('CatalogView', () => {
  beforeEach(() => {
    mockedList.mockReset();
    mockedCategories.mockReset().mockResolvedValue(CATEGORIES);
  });

  function renderView(region: 'VOLTA' | null, filters: CatalogFilters = { page: 0 }) {
    const onRegionChange = jest.fn();
    const onFiltersChange = jest.fn();
    const user = userEvent.setup();
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <CatalogView
          region={region}
          filters={filters}
          onRegionChange={onRegionChange}
          onFiltersChange={onFiltersChange}
          hrefForPage={(p) => `/products?page=${p + 1}`}
        />
      </SWRConfig>,
    );
    return { onRegionChange, onFiltersChange, user };
  }

  it('asks first-time visitors for their region before loading anything', async () => {
    const { onRegionChange, user } = renderView(null);

    expect(screen.getByRole('heading', { name: 'Where are you shopping?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show produce' })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Your region'), 'VOLTA');
    await user.click(screen.getByRole('button', { name: 'Show produce' }));

    expect(onRegionChange).toHaveBeenCalledWith('VOLTA');
    expect(mockedList).not.toHaveBeenCalled();
  });

  it("shows a grid of the region's produce", async () => {
    mockedList.mockResolvedValue(page([card(1), card(2)]));
    renderView('VOLTA');

    const grid = await screen.findByRole('region', { name: 'Produce' });
    expect(within(grid).getAllByRole('link')).toHaveLength(2);
    expect(screen.getByText(/Showing produce from farmers in/)).toHaveTextContent('Volta');
    expect(mockedList).toHaveBeenCalledWith({ region: 'VOLTA', categoryId: undefined, page: 0 });
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('filters by category, resetting to the first page', async () => {
    mockedList.mockResolvedValue(page([card(1)]));
    const { onFiltersChange, user } = renderView('VOLTA', { page: 2 });
    await screen.findByRole('option', { name: 'Fruits' });

    await user.selectOptions(screen.getByLabelText('Category'), 'c-fruit');

    expect(onFiltersChange).toHaveBeenCalledWith({ categoryId: 'c-fruit', page: 0 });
  });

  it('requests the selected category and page', async () => {
    mockedList.mockResolvedValue({ ...page([card(21)], 21), currentPage: 1 });
    renderView('VOLTA', { categoryId: 'c-veg', page: 1 });

    await screen.findByRole('region', { name: 'Produce' });
    expect(mockedList).toHaveBeenCalledWith({ region: 'VOLTA', categoryId: 'c-veg', page: 1 });
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveTextContent('Page 2 of 2');
  });

  it('changes region from the catalog', async () => {
    mockedList.mockResolvedValue(page([card(1)]));
    const { onRegionChange, user } = renderView('VOLTA');
    await screen.findByRole('region', { name: 'Produce' });

    await user.click(screen.getByRole('button', { name: 'Change region' }));
    await user.selectOptions(screen.getByLabelText('Your region'), 'ASHANTI');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(onRegionChange).toHaveBeenCalledWith('ASHANTI');
  });

  it('shows an empty state with a way to change region when the region has no produce', async () => {
    mockedList.mockResolvedValue(page([]));
    const { user } = renderView('VOLTA');

    expect(await screen.findByRole('heading', { name: 'No produce in Volta yet' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Change region' }).at(-1)!);
    expect(screen.getByLabelText('Your region')).toBeInTheDocument();
  });

  it('offers to clear the category when a filtered search is empty', async () => {
    mockedList.mockResolvedValue(page([]));
    const { onFiltersChange, user } = renderView('VOLTA', { categoryId: 'c-fruit', page: 0 });

    expect(await screen.findByRole('heading', { name: 'No Fruits in Volta right now' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all categories' }));
    expect(onFiltersChange).toHaveBeenCalledWith({ page: 0 });
  });

  it('moves to the last page when the requested page is past the end', async () => {
    mockedList.mockResolvedValue({ ...page([], 25), currentPage: 9 });
    const { onFiltersChange } = renderView('VOLTA', { page: 9 });

    await waitFor(() => expect(onFiltersChange).toHaveBeenCalledWith({ page: 1 }));
  });
  it('searches, resetting to the first page and keeping the other filters', async () => {
    mockedList.mockResolvedValue(page([card(1)]));
    const { onFiltersChange, user } = renderView('VOLTA', { categoryId: 'c-fruit', sort: 'price_asc', page: 0 });
    await screen.findByRole('region', { name: 'Produce' });

    await user.type(screen.getByRole('searchbox', { name: 'Search produce or farmers' }), '  okro ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onFiltersChange).toHaveBeenCalledWith({ categoryId: 'c-fruit', sort: 'price_asc', search: 'okro', page: 0 });
  });

  it('applies a price range and rejects one where the minimum is higher', async () => {
    mockedList.mockResolvedValue(page([card(1)]));
    const { onFiltersChange, user } = renderView('VOLTA');
    await screen.findByRole('region', { name: 'Produce' });

    await user.type(screen.getByLabelText('Min'), '20');
    await user.type(screen.getByLabelText('Max'), '10');
    await user.click(screen.getByRole('button', { name: 'Apply price' }));
    expect(screen.getByRole('alert')).toHaveTextContent('The minimum price can’t be more than the maximum.');
    expect(onFiltersChange).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Max'));
    await user.type(screen.getByLabelText('Max'), '25.50');
    await user.click(screen.getByRole('button', { name: 'Apply price' }));
    expect(onFiltersChange).toHaveBeenCalledWith({ minPrice: '20', maxPrice: '25.50', page: 0 });
  });

  it('sorts, and requests the narrowed and sorted page', async () => {
    mockedList.mockResolvedValue(page([card(1)]));
    const { onFiltersChange, user } = renderView('VOLTA', { search: 'yam', minPrice: '5', sort: 'price_asc', page: 0 });
    await screen.findByRole('region', { name: 'Produce' });

    expect(mockedList).toHaveBeenCalledWith(
      expect.objectContaining({ region: 'VOLTA', search: 'yam', minPrice: '5', sort: 'price_asc', page: 0 }),
    );
    await user.selectOptions(screen.getByLabelText('Sort by'), 'Top rated farmers');
    expect(onFiltersChange).toHaveBeenCalledWith({ search: 'yam', minPrice: '5', sort: 'top_rated', page: 0 });
  });

  it('explains an empty search and clears it, keeping the category', async () => {
    mockedList.mockResolvedValue(page([]));
    const { onFiltersChange, user } = renderView('VOLTA', { categoryId: 'c-fruit', search: 'durian', page: 0 });

    expect(await screen.findByRole('heading', { name: 'No produce matches your filters' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search and price' }));
    expect(onFiltersChange).toHaveBeenCalledWith({ categoryId: 'c-fruit', page: 0 });
  });
});

describe('listCatalogProducts', () => {
  const { listCatalogProducts: realList } = jest.requireActual<typeof import('../services/catalogService')>(
    '../services/catalogService',
  );
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends search, price and a non-default sort to the API', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: page([]) }) });
    global.fetch = fetchMock;

    await realList({ region: 'VOLTA', search: 'okro', minPrice: '5', maxPrice: '10.50', sort: 'price_desc', page: 1 });
    await realList({ region: 'VOLTA', sort: 'newest' });

    const params = (call: number) => new URL(fetchMock.mock.calls[call][0], 'http://localhost').searchParams;
    expect(Object.fromEntries(params(0))).toEqual({
      region: 'VOLTA',
      page: '1',
      size: '20',
      q: 'okro',
      minPrice: '5',
      maxPrice: '10.50',
      sort: 'price_desc',
    });
    expect(params(1).has('sort')).toBe(false);
  });
});
