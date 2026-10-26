import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';
import type { OrderDetail, OrderStatus, OrderSummary, PaginatedResponse } from '@cheap-market/shared-types';

import { OrderConfirmation } from '../components/orders/OrderConfirmation';
import { OrderHistory } from '../components/orders/OrderHistory';
import { STATUS_LABELS, StatusBadge } from '../components/orders/StatusBadge';
import { countOrders, getOrder, listOrders } from '../services/orderService';

jest.mock('../services/orderService', () => ({
  listOrders: jest.fn(),
  countOrders: jest.fn(),
  getOrder: jest.fn(),
  placeOrder: jest.fn(),
}));

const mockedList = listOrders as jest.MockedFunction<typeof listOrders>;
const mockedGet = getOrder as jest.MockedFunction<typeof getOrder>;
const mockedCounts = countOrders as jest.MockedFunction<typeof countOrders>;

function wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>;
}

function order(n: number, overrides: Partial<OrderSummary> = {}): OrderSummary {
  return {
    id: `order-${n}`,
    orderNumber: `CM-${String(n).padStart(8, '0')}`,
    createdAt: '2026-10-24T14:30:00Z',
    finalTotalCents: 4500,
    status: 'PENDING',
    fulfillmentType: 'PICKUP',
    itemCount: 3,
    farmersToRate: [],
    ...overrides,
  };
}

/** Serves `total` orders, 10 per page, like the API. */
function serveOrders(total: number) {
  const all = Array.from({ length: total }, (_, i) => order(i + 1));
  mockedList.mockImplementation(async (page = 0): Promise<PaginatedResponse<OrderSummary>> => ({
    content: all.slice(page * 10, page * 10 + 10),
    currentPage: page,
    totalPages: Math.ceil(total / 10),
    totalElements: total,
    size: 10,
  }));
}

/** A controllable IntersectionObserver: call `scrollNearEnd()` to report the sentinel as visible. */
let observerCallback: IntersectionObserverCallback | null = null;
function installIntersectionObserver() {
  (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback;
    }
    observe() {}
    disconnect() {}
  };
}
function scrollNearEnd() {
  act(() => observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
}

beforeEach(() => {
  mockedList.mockReset();
  mockedGet.mockReset();
  mockedCounts.mockReset();
  mockedCounts.mockResolvedValue({ all: 0, active: 0, completed: 0, disputed: 0 });
  observerCallback = null;
  delete (global as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
});

describe('StatusBadge', () => {
  it.each(Object.entries(STATUS_LABELS))('labels %s as "%s"', (status, label) => {
    render(<StatusBadge status={status as OrderStatus} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('uses the colour for each status', () => {
    const { rerender } = render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('Pending')).toHaveClass('bg-status-pending');
    rerender(<StatusBadge status="DISPUTED" />);
    expect(screen.getByText('Disputed')).toHaveClass('bg-status-disputed');
  });
});

describe('OrderHistory', () => {
  it('lists orders with number, date, items, fulfillment, status and total, linking to each order', async () => {
    serveOrders(0);
    mockedList.mockResolvedValue({
      content: [order(1, { status: 'COMPLETED', finalTotalCents: 11000, fulfillmentType: 'DELIVERY', itemCount: 1 }), order(2)],
      currentPage: 0,
      totalPages: 1,
      totalElements: 2,
      size: 10,
    });
    render(<OrderHistory />, { wrapper });

    const list = await screen.findByRole('list', { name: 'Your orders' });
    const [first] = within(list).getAllByRole('link');
    expect(first).toHaveAttribute('href', '/orders/order-1');
    expect(first).toHaveTextContent('CM-00000001');
    expect(first).toHaveTextContent('24 Oct 2026 · 1 item · Delivery');
    expect(first).toHaveTextContent('Completed');
    expect(first).toHaveTextContent('GH₵ 110.00');
    expect(screen.getByText('2 orders')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more orders' })).not.toBeInTheDocument();
  });

  it('shows an empty state when the buyer has no orders', async () => {
    serveOrders(0);
    render(<OrderHistory />, { wrapper });

    expect(await screen.findByRole('heading', { name: 'No orders yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse produce' })).toHaveAttribute('href', '/products');
  });

  it('loads more pages as the buyer scrolls, across more than three pages', async () => {
    installIntersectionObserver();
    serveOrders(35);
    render(<OrderHistory />, { wrapper });
    const rows = () => within(screen.getByRole('list', { name: 'Your orders' })).getAllByRole('listitem');

    await waitFor(() => expect(rows()).toHaveLength(10));
    for (const expected of [20, 30, 35]) {
      scrollNearEnd();
      await waitFor(() => expect(rows()).toHaveLength(expected));
    }

    expect(mockedList.mock.calls.map(([page]) => page)).toEqual([0, 1, 2, 3]);
    expect(rows()[34]).toHaveTextContent('CM-00000035');
    expect(screen.getByText("That's all your orders.")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more orders' })).not.toBeInTheDocument();
  });

  it('shows a spinner while the next page loads', async () => {
    installIntersectionObserver();
    serveOrders(25);
    render(<OrderHistory />, { wrapper });
    await screen.findByRole('list', { name: 'Your orders' });
    let release!: () => void;
    const nextPage = new Promise<void>((resolve) => (release = resolve));
    const original = mockedList.getMockImplementation()!;
    mockedList.mockImplementationOnce(async (page) => {
      await nextPage;
      return original(page);
    });

    scrollNearEnd();

    expect(await screen.findByRole('status')).toHaveTextContent('Loading more orders…');
    await act(async () => release());
    await waitFor(() => expect(screen.queryByText('Loading more orders…')).not.toBeInTheDocument());
  });

  it('offers a Load more button when scrolling can’t be detected', async () => {
    serveOrders(15);
    const user = userEvent.setup();
    render(<OrderHistory />, { wrapper });

    await user.click(await screen.findByRole('button', { name: 'Load more orders' }));

    await waitFor(() =>
      expect(within(screen.getByRole('list', { name: 'Your orders' })).getAllByRole('listitem')).toHaveLength(15),
    );
  });
});

describe('OrderHistory tabs', () => {
  it('shows each tab with its count and lists only that tab’s orders', async () => {
    mockedCounts.mockResolvedValue({ all: 3, active: 1, completed: 1, disputed: 1 });
    mockedList.mockImplementation(async (page = 0, status) => {
      const content = status === 'disputed' ? [order(3, { status: 'DISPUTED' })] : [order(1), order(2), order(3)];
      return { content, currentPage: page, totalPages: 1, totalElements: content.length, size: 10 };
    });
    const user = userEvent.setup();
    render(<OrderHistory />, { wrapper });

    const tabs = await screen.findByRole('group', { name: 'Filter orders' });
    expect(await within(tabs).findByRole('button', { name: 'Disputed 1' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(tabs).getByRole('button', { name: 'All 3' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(within(tabs).getByRole('button', { name: 'Disputed 1' }));

    await waitFor(() =>
      expect(within(screen.getByRole('list', { name: 'Your orders' })).getAllByRole('listitem')).toHaveLength(1),
    );
    expect(mockedList).toHaveBeenLastCalledWith(0, 'disputed');
    expect(within(tabs).getByRole('button', { name: 'Disputed 1' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 order')).toBeInTheDocument();
  });

  it('explains an empty tab without the first-order welcome', async () => {
    mockedCounts.mockResolvedValue({ all: 2, active: 2, completed: 0, disputed: 0 });
    mockedList.mockImplementation(async (page = 0, status) => {
      const content = status === 'completed' ? [] : [order(1), order(2)];
      return { content, currentPage: page, totalPages: content.length ? 1 : 0, totalElements: content.length, size: 10 };
    });
    const user = userEvent.setup();
    render(<OrderHistory />, { wrapper });

    await user.click(await screen.findByRole('button', { name: /^Completed/ }));

    expect(await screen.findByText('No completed orders yet.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'No orders yet' })).not.toBeInTheDocument();
  });
});

describe('Order detail', () => {
  it('shows the order with a link back to My orders instead of the thank-you message', async () => {
    mockedGet.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'CM-7K3F9Q2X',
      status: 'OUT_FOR_DELIVERY',
      paymentStatus: 'UNPAID',
      items: [],
      itemsSubtotalCents: 0,
      deliveryFeeCents: 1000,
      finalTotalCents: 1000,
      fulfillmentType: 'DELIVERY',
      deliveryAddress: { street: '12 Ring Rd', town: 'Ho', gpsAddress: null },
      pickupLocation: null,
      createdAt: '2026-10-24T14:30:00Z',
      farmers: [],
      dispute: null,
    } satisfies OrderDetail);
    render(<OrderConfirmation orderId="order-1" variant="detail" />, { wrapper });

    expect(await screen.findByRole('heading', { name: 'Order CM-7K3F9Q2X' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← My orders' })).toHaveAttribute('href', '/orders');
    expect(screen.getByText('Out for Delivery')).toBeInTheDocument();
    expect(screen.queryByText('Thank you! Your order is placed.')).not.toBeInTheDocument();
  });
});
