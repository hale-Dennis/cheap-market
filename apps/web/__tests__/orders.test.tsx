import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';
import type { AdminNotifications, OrderDetail } from '@cheap-market/shared-types';

import { NotificationsPanel } from '../components/admin/NotificationsPanel';
import { OrderConfirmation } from '../components/orders/OrderConfirmation';
import { ApiError } from '../services/apiClient';
import {
  getAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';
import { getOrder } from '../services/orderService';

jest.mock('../services/orderService', () => ({ getOrder: jest.fn(), placeOrder: jest.fn() }));
jest.mock('../services/notificationService', () => ({
  getAdminNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockedGetOrder = getOrder as jest.MockedFunction<typeof getOrder>;
const mocked = {
  list: getAdminNotifications as jest.MockedFunction<typeof getAdminNotifications>,
  read: markNotificationRead as jest.MockedFunction<typeof markNotificationRead>,
  readAll: markAllNotificationsRead as jest.MockedFunction<typeof markAllNotificationsRead>,
};

function wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>;
}

const DELIVERY_ORDER: OrderDetail = {
  id: 'order-1',
  orderNumber: 'CM-7K3F9Q2X',
  status: 'PENDING',
  paymentStatus: 'UNPAID',
  items: [
    { productId: 'p-1', name: 'Okro', unit: 'per kg', quantity: 2, priceAtPurchaseCents: 5000, lineTotalCents: 10000 },
  ],
  itemsSubtotalCents: 10000,
  deliveryFeeCents: 1000,
  finalTotalCents: 11000,
  fulfillmentType: 'DELIVERY',
  deliveryAddress: { street: '12 Ring Rd', town: 'Ho', gpsAddress: null },
  pickupLocation: null,
  createdAt: '2026-10-24T14:30:00Z',
  farmers: [{ farmerId: 'f-1', fullName: 'Ama Mensah', rating: null }],
  dispute: null,
};

describe('OrderConfirmation', () => {
  beforeEach(() => mockedGetOrder.mockReset());

  it('shows the order number, status, items, totals and delivery address', async () => {
    mockedGetOrder.mockResolvedValue(DELIVERY_ORDER);
    render(<OrderConfirmation orderId="order-1" />, { wrapper });

    expect(await screen.findByRole('heading', { name: 'Thank you! Your order is placed.' })).toBeInTheDocument();
    expect(screen.getByText('CM-7K3F9Q2X')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Order progress' }).querySelector('[aria-current="step"]')).toHaveTextContent('Pending');
    expect(screen.getByText('Payment').nextElementSibling).toHaveTextContent('Pay when you receive it');
    expect(screen.getByText('12 Ring Rd, Ho')).toBeInTheDocument();
    const items = screen.getByRole('region', { name: 'Items' });
    expect(items).toHaveTextContent('Okro × 2 (GH₵ 50.00 per kg)GH₵ 100.00');
    expect(within(items).getByText('Delivery').nextElementSibling).toHaveTextContent('GH₵ 10.00');
    expect(within(items).getByText('Total').nextElementSibling).toHaveTextContent('GH₵ 110.00');
    expect(mockedGetOrder).toHaveBeenCalledWith('order-1');
  });

  it('shows the pickup point for pickup orders', async () => {
    mockedGetOrder.mockResolvedValue({
      ...DELIVERY_ORDER,
      fulfillmentType: 'PICKUP',
      deliveryFeeCents: 0,
      finalTotalCents: 10000,
      deliveryAddress: null,
      pickupLocation: {
        id: 'loc-1',
        name: 'Makola Market',
        region: 'GREATER_ACCRA',
        address: { street: 'Kojo Thompson Rd', town: 'Accra', gpsAddress: null },
        operatingHours: 'Mon–Sat 7am–6pm',
      },
    });
    render(<OrderConfirmation orderId="order-1" />, { wrapper });

    expect(await screen.findByText('Collect from Makola Market')).toBeInTheDocument();
    expect(screen.getByText('Open Mon–Sat 7am–6pm')).toBeInTheDocument();
    expect(screen.getByText('Payment').nextElementSibling).toHaveTextContent('Pay when you collect it');
    expect(within(screen.getByRole('region', { name: 'Items' })).getByText('Free')).toBeInTheDocument();
  });

  it.each([
    ['an unknown order', 'order-x', new ApiError('Order not found', 404)],
    ['no order id', null, null],
  ])('shows "not found" for %s', async (_, orderId, error) => {
    if (error) mockedGetOrder.mockRejectedValue(error);
    render(<OrderConfirmation orderId={orderId} />, { wrapper });

    expect(await screen.findByRole('heading', { name: "We couldn't find that order" })).toBeInTheDocument();
  });
});

describe('NotificationsPanel', () => {
  const NOTIFICATIONS: AdminNotifications = {
    unreadCount: 1,
    notifications: [
      { id: 'n-1', type: 'NEW_ORDER', message: 'New order CM-7K3F9Q2X from Jane Doe', orderId: 'order-1', createdAt: new Date().toISOString(), read: false },
      { id: 'n-2', type: 'NEW_ORDER', message: 'New order CM-AAAAAAAA from Kofi', orderId: 'order-2', createdAt: '2026-10-01T10:00:00Z', read: true },
    ],
  };

  beforeEach(() => Object.values(mocked).forEach((fn) => fn.mockReset()));

  it('lists notifications newest first with the unread count', async () => {
    mocked.list.mockResolvedValue(NOTIFICATIONS);
    render(<NotificationsPanel />, { wrapper });

    const list = await screen.findByRole('list', { name: 'Recent notifications' });
    expect(screen.getByText('1 new')).toBeInTheDocument();
    const [unread, read] = within(list).getAllByRole('listitem');
    expect(unread).toHaveTextContent('Unread: New order CM-7K3F9Q2X from Jane Doe');
    expect(unread).toHaveTextContent('just now');
    expect(read).not.toHaveTextContent('Unread');
    expect(within(read).queryByRole('button')).not.toBeInTheDocument();
  });

  it('marks one or all notifications as read', async () => {
    mocked.list.mockResolvedValue(NOTIFICATIONS);
    mocked.read.mockResolvedValue(undefined);
    mocked.readAll.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<NotificationsPanel />, { wrapper });
    await screen.findByRole('list', { name: 'Recent notifications' });

    await user.click(screen.getByRole('button', { name: 'Mark as read: New order CM-7K3F9Q2X from Jane Doe' }));
    expect(mocked.read).toHaveBeenCalledWith('n-1');

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(mocked.readAll).toHaveBeenCalled();
    await waitFor(() => expect(mocked.list.mock.calls.length).toBeGreaterThanOrEqual(3));
  });

  it('explains that new orders will appear here', async () => {
    mocked.list.mockResolvedValue({ unreadCount: 0, notifications: [] });
    render(<NotificationsPanel />, { wrapper });

    expect(await screen.findByText('No notifications yet. New orders and reported issues will appear here.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument();
  });
});
