import { render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import type { ProductCard } from '@cheap-market/shared-types';

import HomePage from '../pages/index';
import { listCatalogProducts, listPublicCategories } from '../services/catalogService';
import { getPublicStats } from '../services/statsService';

jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/' }) }));
// The page's getServerSideProps imports the JWT helpers, whose ESM build Jest can't load.
jest.mock('../lib/auth', () => ({ ACCESS_TOKEN_COOKIE: 'cm_access_token', verifyAccessToken: jest.fn() }));
jest.mock('../services/statsService', () => ({ getPublicStats: jest.fn() }));
jest.mock('../services/catalogService', () => ({
  listCatalogProducts: jest.fn(),
  listPublicCategories: jest.fn(),
}));

const mockedList = listCatalogProducts as jest.MockedFunction<typeof listCatalogProducts>;
const mockedCategories = listPublicCategories as jest.MockedFunction<typeof listPublicCategories>;
const mockedStats = getPublicStats as jest.MockedFunction<typeof getPublicStats>;

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
    mockedStats.mockResolvedValue({ farmers: 0, regions: 0 });
    mockedCategories.mockResolvedValue([{ id: 'c-1', name: 'Tubers' }]);
    mockedList.mockResolvedValue({
      content: [1, 2, 3, 4, 5].map(product),
      currentPage: 0,
      totalPages: 1,
      totalElements: 5,
      size: 20,
    });
  });

  it('renders the hero with links to the catalog and sign-up', async () => {
    renderHome();
    await screen.findByRole('link', { name: 'Tubers' });
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
    await waitFor(() => expect(mockedList).toHaveBeenCalled());
    await screen.findByRole('heading', { name: /how it works|three steps/i });
    expect(screen.queryByRole('region', { name: 'Shop by category' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Fresh this week' })).not.toBeInTheDocument();
  });

  it('shows farmers selling and regions covered in the hero once there are farmers', async () => {
    mockedStats.mockResolvedValue({ farmers: 42, regions: 1 });
    renderHome();

    const farmers = await screen.findByText('Farmers selling');
    expect(farmers.nextElementSibling).toHaveTextContent('42');
    expect(screen.getByText('Region covered').nextElementSibling).toHaveTextContent('1');
  });

  it('leaves the hero numbers out before any farmer is selling', async () => {
    renderHome();
    await screen.findByRole('link', { name: 'Tubers' });
    expect(mockedStats).toHaveBeenCalled();
    expect(screen.queryByText(/selling/)).not.toBeInTheDocument();
  });

  it('sends the email from the closing sign-up box to the sign-up page', async () => {
    renderHome();
    await screen.findByRole('link', { name: 'Tubers' });
    const email = screen.getByRole('textbox', { name: 'Email address' });
    const form = email.closest('form')!;

    expect(email).toHaveAttribute('name', 'email');
    expect(email).toBeRequired();
    expect(form).toHaveAttribute('action', '/signup');
    expect(form).toHaveAttribute('method', 'get');
    expect(screen.getByRole('button', { name: 'Get started' })).toHaveAttribute('type', 'submit');
  });
});
