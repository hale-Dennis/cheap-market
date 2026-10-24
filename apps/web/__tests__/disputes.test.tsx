import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';
import type { Dispute, OrderDetail } from '@cheap-market/shared-types';

import { NotificationsPanel } from '../components/admin/NotificationsPanel';
import { DisputeFormModal } from '../components/disputes/DisputeFormModal';
import { OrderConfirmation } from '../components/orders/OrderConfirmation';
import { ApiError } from '../services/apiClient';
import { createDispute } from '../services/disputeService';
import { getAdminNotifications } from '../services/notificationService';
import { getOrder } from '../services/orderService';

jest.mock('../services/orderService', () => ({ listOrders: jest.fn(), getOrder: jest.fn(), placeOrder: jest.fn() }));
jest.mock('../services/disputeService', () => ({ createDispute: jest.fn() }));
jest.mock('../services/notificationService', () => ({
  getAdminNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mocked = {
  get: getOrder as jest.MockedFunction<typeof getOrder>,
  report: createDispute as jest.MockedFunction<typeof createDispute>,
  notifications: getAdminNotifications as jest.MockedFunction<typeof getAdminNotifications>,
};

function wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>;
}

const DISPUTE: Dispute = {
  id: 'd-1',
  orderId: 'order-1',
  status: 'OPEN',
  reason: 'Half the tomatoes were rotten.',
  createdAt: '2026-10-24T16:00:00Z',
};

const ORDER: OrderDetail = {
  id: 'order-1',
  orderNumber: 'CM-7K3F9Q2X',
  status: 'COMPLETED',
  paymentStatus: 'PAID',
  items: [],
  itemsSubtotalCents: 0,
  deliveryFeeCents: 0,
  finalTotalCents: 0,
  fulfillmentType: 'PICKUP',
  deliveryAddress: null,
  pickupLocation: null,
  createdAt: '2026-10-24T14:30:00Z',
  farmers: [{ farmerId: 'f-1', fullName: 'Ama Mensah', rating: null }],
  dispute: null,
};

beforeEach(() => {
  Object.values(mocked).forEach((fn) => fn.mockReset());
  jest.mocked(toast.success).mockReset();
  jest.mocked(toast.error).mockReset();
});

describe('DisputeFormModal', () => {
  function renderModal() {
    const onReported = jest.fn();
    const onOpenChange = jest.fn();
    render(
      <DisputeFormModal orderId="order-1" orderNumber="CM-7K3F9Q2X" open onOpenChange={onOpenChange} onReported={onReported} />,
    );
    return { onReported, onOpenChange, user: userEvent.setup() };
  }

  it('keeps Submit disabled until there is a description', async () => {
    const { user } = renderModal();
    const reason = screen.getByLabelText('What went wrong?');

    expect(screen.getByRole('dialog', { name: 'Report an issue' })).toHaveTextContent('CM-7K3F9Q2X');
    expect(reason).toHaveAttribute('placeholder', 'Describe the issue');
    expect(screen.getByRole('button', { name: 'Submit report' })).toBeDisabled();

    await user.type(reason, '   ');
    expect(screen.getByRole('button', { name: 'Submit report' })).toBeDisabled();

    await user.type(reason, 'Rotten');
    expect(screen.getByRole('button', { name: 'Submit report' })).toBeEnabled();
  });

  it('counts characters and stops at 500', () => {
    renderModal();
    const reason = screen.getByLabelText('What went wrong?');

    fireEvent.change(reason, { target: { value: 'x'.repeat(520) } });

    expect(reason).toHaveValue('x'.repeat(500));
    expect(screen.getByText('500/500 characters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit report' })).toBeEnabled();
  });

  it('sends the trimmed description, then confirms and refreshes', async () => {
    mocked.report.mockResolvedValue(DISPUTE);
    const { user, onReported, onOpenChange } = renderModal();

    await user.type(screen.getByLabelText('What went wrong?'), '  Half the tomatoes were rotten.  ');
    await user.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(mocked.report).toHaveBeenCalledWith({ orderId: 'order-1', reason: 'Half the tomatoes were rotten.' });
    expect(toast.success).toHaveBeenCalledWith("Thanks for letting us know. We'll review the issue and get back to you.");
    expect(onReported).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('on a duplicate (409), shows a toast and refreshes to the existing report', async () => {
    mocked.report.mockRejectedValue(new ApiError("You've already reported an issue with this order.", 409, 'ALREADY_DISPUTED'));
    const { user, onReported, onOpenChange } = renderModal();

    await user.type(screen.getByLabelText('What went wrong?'), 'Again');
    await user.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(toast.error).toHaveBeenCalledWith("You've already reported an issue with this order.");
    expect(onReported).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the dialog open with the message on other errors', async () => {
    mocked.report.mockRejectedValue(new ApiError('Validation failed: reason: Reason cannot exceed 500 characters', 400));
    const { user, onOpenChange } = renderModal();

    await user.type(screen.getByLabelText('What went wrong?'), 'Bad');
    await user.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Reason cannot exceed 500 characters');
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});

describe('Reporting an issue from the order page', () => {
  it('offers Report issue on a completed order, then shows the order as disputed with the report', async () => {
    mocked.get.mockResolvedValueOnce(ORDER).mockResolvedValue({ ...ORDER, status: 'DISPUTED', dispute: DISPUTE });
    mocked.report.mockResolvedValue(DISPUTE);
    const user = userEvent.setup();
    render(<OrderConfirmation orderId="order-1" variant="detail" />, { wrapper });

    await user.click(await screen.findByRole('button', { name: 'Report issue' }));
    await user.type(screen.getByLabelText('What went wrong?'), 'Half the tomatoes were rotten.');
    await user.click(screen.getByRole('button', { name: 'Submit report' }));

    const issue = await screen.findByRole('region', { name: 'Issue reported' });
    expect(issue).toHaveTextContent('Half the tomatoes were rotten.');
    expect(issue).toHaveTextContent("We've received your report and will review it soon.");
    expect(screen.getByText('Status').nextElementSibling).toHaveTextContent('Disputed');
    expect(screen.queryByRole('button', { name: 'Report issue' })).not.toBeInTheDocument();
    // The farmer can still be rated on a disputed order.
    expect(screen.getByRole('button', { name: 'Rate Ama Mensah' })).toBeInTheDocument();
  });

  it.each(['PENDING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'] as const)('offers no Report issue while %s', async (status) => {
    mocked.get.mockResolvedValue({ ...ORDER, status });
    render(<OrderConfirmation orderId="order-1" variant="detail" />, { wrapper });

    await screen.findByRole('heading', { name: 'Order CM-7K3F9Q2X' });
    expect(screen.queryByRole('button', { name: 'Report issue' })).not.toBeInTheDocument();
  });

  it('shows how the review is going', async () => {
    mocked.get.mockResolvedValue({ ...ORDER, status: 'DISPUTED', dispute: { ...DISPUTE, status: 'UNDER_REVIEW' } });
    render(<OrderConfirmation orderId="order-1" variant="detail" />, { wrapper });

    expect(await screen.findByRole('region', { name: 'Issue reported' })).toHaveTextContent('Our team is looking into it.');
  });
});

describe('Admin notifications', () => {
  it('marks dispute notifications', async () => {
    mocked.notifications.mockResolvedValue({
      unreadCount: 1,
      notifications: [
        { id: 'n-1', type: 'DISPUTE_OPENED', message: 'Issue reported on order CM-7K3F9Q2X by Jane Doe: "Rotten"', orderId: 'order-1', createdAt: new Date().toISOString(), read: false },
        { id: 'n-2', type: 'NEW_ORDER', message: 'New order CM-AAAAAAAA from Kofi', orderId: 'order-2', createdAt: new Date().toISOString(), read: true },
      ],
    });
    render(<NotificationsPanel />, { wrapper });

    const [dispute, order] = within(await screen.findByRole('list', { name: 'Recent notifications' })).getAllByRole('listitem');
    expect(dispute).toHaveTextContent('Unread: Dispute:Issue reported on order CM-7K3F9Q2X');
    expect(order).not.toHaveTextContent('Dispute');
  });
});
