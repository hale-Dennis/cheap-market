import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';
import type { ProductCard } from '@cheap-market/shared-types';

import HomePage from '../pages/index';
import { listCatalogProducts, listPublicCategories } from '../services/catalogService';

jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/' }) }));
// The page's getServerSideProps imports the JWT helpers, whose ESM build Jest can't load.
jest.mock('../lib/auth', () => ({ ACCESS_TOKEN_COOKIE: 'cm_access_token', verifyAccessToken: jest.fn() }));
jest.mock('../services/catalogService', () => ({
  listCatalogProducts: jest.fn(),
  listPublicCategories: jest.fn(),
}));

const mockedList = listCatalogProducts as jest.MockedFunction<typeof listCatalogProducts>;
const mockedCategories = listPublicCategories as jest.MockedFunction<typeof listPublicCategories>;

function product(index: number): ProductCard {
  return {
    id: `p-${index}`,
    name: `Produce ${index}`,
    priceCents: 1500,
    unit: 'per kg',
    primaryImageUrl: null,
    harvestDate: new Date().toLocaleDateString('en-CA'),
    farmerName: 'Ama Mensah',
    categoryName: 'Vegetables',
  };
}

function renderHome() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <HomePage region="ASHANTI" session={null} />
    </SWRConfig>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    mockedCategories.mockResolvedValue([{ id: 'c-1', name: 'Tubers' }]);
    mockedList.mockResolvedValue({
      content: [1, 2, 3, 4, 5].map(product),
      currentPage: 0,
      totalPages: 1,
      totalElements: 5,
      size: 20,
    });
  });

  it('renders the hero with links to the catalog and sign-up', () => {
    renderHome();
    expect(screen.getByRole('heading', { level: 1, name: /no middlemen/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse produce/i })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/signup');
  });

  it('links each category to the filtered catalog', async () => {
    renderHome();
    expect(await screen.findByRole('link', { name: 'Tubers' })).toHaveAttribute('href', '/products?category=c-1');
  });

  it("shows four of this week's listings from the visitor's region", async () => {
    renderHome();
    const section = await screen.findByRole('region', { name: 'Fresh this week' });
    expect(await screen.findByText('Produce 4')).toBeInTheDocument();
    expect(screen.queryByText('Produce 5')).not.toBeInTheDocument();
    expect(section).toHaveTextContent('Ashanti');
    expect(mockedList).toHaveBeenCalledWith({ region: 'ASHANTI', page: 0 });
  });

  it('leaves out sections that have nothing to show', async () => {
    mockedCategories.mockResolvedValue([]);
    mockedList.mockResolvedValue({ content: [], currentPage: 0, totalPages: 0, totalElements: 0, size: 20 });
    renderHome();
    await screen.findByRole('heading', { name: /how it works|three steps/i });
    expect(screen.queryByRole('region', { name: 'Shop by category' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Fresh this week' })).not.toBeInTheDocument();
  });
});
