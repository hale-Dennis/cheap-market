import { render, screen, waitFor, within } from '@testing-library/react';
import { SWRConfig } from 'swr';
import type { Farmer, PaginatedResponse } from '@cheap-market/shared-types';

import { FarmerList } from '../components/farmers/FarmerList';
import { ApiError } from '../services/apiClient';
import { listFarmers } from '../services/farmerService';

jest.mock('../services/farmerService', () => ({ listFarmers: jest.fn() }));

const mockedListFarmers = listFarmers as jest.MockedFunction<typeof listFarmers>;

function farmer(index: number, overrides: Partial<Farmer> = {}): Farmer {
  return {
    id: `f-${index}`,
    fullName: `Farmer ${index}`,
    email: `farmer${index}@test.com`,
    phoneNumber: `+23324${String(index).padStart(7, '0')}`,
    region: 'GREATER_ACCRA',
    accountStatus: 'ACTIVE',
    createdAt: '2026-10-24T12:00:00Z',
    ...overrides,
  };
}

function pageOf(
  farmers: Farmer[],
  { currentPage = 0, totalElements = farmers.length, size = 20 } = {},
): PaginatedResponse<Farmer> {
  return {
    content: farmers,
    currentPage,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    size,
  };
}

const hrefForPage = (page: number) => (page === 0 ? '/admin/farmers' : `/admin/farmers?page=${page + 1}`);

function renderList(page = 0, onPageOutOfRange = jest.fn()) {
  render(
    // Fresh cache per test so responses don't leak between tests.
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <FarmerList page={page} hrefForPage={hrefForPage} onPageOutOfRange={onPageOutOfRange} />
    </SWRConfig>,
  );
  return { onPageOutOfRange };
}

describe('FarmerList', () => {
  beforeEach(() => {
    mockedListFarmers.mockReset();
  });

  it('renders each farmer with name, region, phone and email', async () => {
    mockedListFarmers.mockResolvedValue(
      pageOf([farmer(1), farmer(2, { region: 'UPPER_EAST', email: null })]),
    );
    renderList();

    const rows = await screen.findAllByRole('row');
    expect(rows).toHaveLength(3); // header + 2
    expect(within(rows[1]).getByText('Farmer 1')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Greater Accra')).toBeInTheDocument();
    expect(within(rows[1]).getByText('024 000 0001')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Upper East')).toBeInTheDocument();
    expect(within(rows[2]).getByText('No email')).toBeInTheDocument();
    expect(mockedListFarmers).toHaveBeenCalledWith(0);
  });

  it('hides pagination when everything fits on one page', async () => {
    mockedListFarmers.mockResolvedValue(pageOf([farmer(1)]));
    renderList();

    await screen.findByText('Farmer 1');
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('paginates when there are more than 20 farmers', async () => {
    const firstPage = Array.from({ length: 20 }, (_, i) => farmer(i + 1));
    mockedListFarmers.mockResolvedValue(pageOf(firstPage, { totalElements: 45 }));
    renderList();

    const nav = await screen.findByRole('navigation', { name: 'Pagination' });
    expect(screen.getAllByRole('row')).toHaveLength(21);
    expect(nav).toHaveTextContent('Showing 1–20 of 45 farmers');
    expect(within(nav).getByText('Page 1 of 3')).toBeInTheDocument();
    expect(within(nav).getByText('Previous')).toHaveAttribute('aria-disabled', 'true');
    expect(within(nav).getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/admin/farmers?page=2',
    );
  });

  it('requests the given page and links back to the previous one', async () => {
    const lastPage = Array.from({ length: 5 }, (_, i) => farmer(i + 41));
    mockedListFarmers.mockResolvedValue(pageOf(lastPage, { currentPage: 2, totalElements: 45 }));
    renderList(2);

    const nav = await screen.findByRole('navigation', { name: 'Pagination' });
    expect(mockedListFarmers).toHaveBeenCalledWith(2);
    expect(nav).toHaveTextContent('Showing 41–45 of 45 farmers');
    expect(within(nav).getByText('Page 3 of 3')).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      '/admin/farmers?page=2',
    );
    expect(within(nav).getByText('Next')).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows an empty state with a link to create the first farmer', async () => {
    mockedListFarmers.mockResolvedValue(pageOf([]));
    renderList();

    expect(await screen.findByRole('heading', { name: 'No farmers yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create farmer' })).toHaveAttribute(
      'href',
      '/admin/farmers/create',
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('reports a page beyond the end so the caller can redirect to the last page', async () => {
    mockedListFarmers.mockResolvedValue(pageOf([], { currentPage: 9, totalElements: 45 }));
    const { onPageOutOfRange } = renderList(9);

    await waitFor(() => expect(onPageOutOfRange).toHaveBeenCalledWith(2));
    // Keeps showing the loading state (not an empty table) while the caller redirects.
    expect(screen.getByText('Loading farmers…')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows the API error message when loading fails', async () => {
    mockedListFarmers.mockRejectedValue(new ApiError('Unable to reach the server.', 502));
    renderList();

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the server.');
  });
});
