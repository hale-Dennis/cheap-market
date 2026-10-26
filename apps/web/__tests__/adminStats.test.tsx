import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

import { StatTiles } from '../components/admin/StatTiles';
import { getAdminStats } from '../services/statsService';

jest.mock('../services/statsService', () => ({ getAdminStats: jest.fn() }));

const mockedStats = getAdminStats as jest.MockedFunction<typeof getAdminStats>;

function wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>;
}

/** The value shown under a tile's label. */
const tile = (label: string) => screen.getByText(label).nextElementSibling;

describe('StatTiles', () => {
  it('shows the dashboard counts, highlighting open disputes', async () => {
    mockedStats.mockResolvedValue({ farmers: 12, liveListings: 30, ordersInProgress: 4, openDisputes: 2 });
    render(<StatTiles />, { wrapper });

    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(tile('Farmers')).toHaveTextContent('12');
    expect(tile('Live listings')).toHaveTextContent('30');
    expect(tile('Orders in progress')).toHaveTextContent('4');
    expect(tile('Open disputes')).toHaveTextContent('2');
    expect(screen.getByText('Open disputes').parentElement).toHaveClass('bg-status-disputed');
  });

  it('leaves the tiles out if the counts can’t be loaded', async () => {
    mockedStats.mockRejectedValue(new Error('down'));
    const { container } = render(<StatTiles />, { wrapper });

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
