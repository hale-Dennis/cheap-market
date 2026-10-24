import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';
import type { OrderDetail, OrderSummary } from '@cheap-market/shared-types';

import { OrderConfirmation } from '../components/orders/OrderConfirmation';
import { OrderHistory } from '../components/orders/OrderHistory';
import { RateFarmerModal } from '../components/ratings/RateFarmerModal';
import { ApiError } from '../services/apiClient';
import { getOrder, listOrders } from '../services/orderService';
import { createRating } from '../services/ratingService';

jest.mock('../services/orderService', () => ({ listOrders: jest.fn(), getOrder: jest.fn(), placeOrder: jest.fn() }));
jest.mock('../services/ratingService', () => ({ createRating: jest.fn(), getFarmerRating: jest.fn() }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mocked = {
  list: listOrders as jest.MockedFunction<typeof listOrders>,
  get: getOrder as jest.MockedFunction<typeof getOrder>,
  rate: createRating as jest.MockedFunction<typeof createRating>,
};

function wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>;
}

const KOFI = { farmerId: 'f-kofi', fullName: 'Kofi Boateng', rating: null };
const AMA = { farmerId: 'f-ama', fullName: 'Ama Mensah', rating: null };
const SAVED = { id: 'r-1', score: 4, comment: null, orderId: 'order-1', farmerId: KOFI.farmerId, createdAt: '2026-10-24T15:00:00Z' };

beforeEach(() => {
  Object.values(mocked).forEach((fn) => fn.mockReset());
  jest.mocked(toast.success).mockReset();
  jest.mocked(toast.error).mockReset();
});

describe('RateFarmerModal', () => {
  function renderModal() {
    const onRated = jest.fn();
    const onClose = jest.fn();
    render(<RateFarmerModal orderId="order-1" farmer={KOFI} onClose={onClose} onRated={onRated} />);
    return { onRated, onClose, user: userEvent.setup() };
  }

  it('keeps Submit disabled until a star is chosen, and describes the choice', async () => {
    const { user } = renderModal();

    expect(screen.getByRole('dialog', { name: 'Rate Kofi Boateng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit rating' })).toBeDisabled();
    expect(screen.getByText('Choose 1 to 5 stars.')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: '4 stars' }));

    expect(screen.getByRole('radio', { name: '4 stars' })).toBeChecked();
    expect(screen.getByText('4 out of 5 · Very good')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit rating' })).toBeEnabled();
  });

  it('counts comment characters and stops at 300', async () => {
    const { user } = renderModal();
    const comment = screen.getByLabelText('Comment (optional)');

    await user.type(comment, 'Sweet yams');
    expect(screen.getByText('10/300 characters')).toBeInTheDocument();

    fireEvent.change(comment, { target: { value: 'x'.repeat(305) } });
    expect(comment).toHaveValue('x'.repeat(300));
    expect(screen.getByText('300/300 characters')).toBeInTheDocument();
  });

  it('submits the stars and trimmed comment, then confirms and refreshes', async () => {
    mocked.rate.mockResolvedValue(SAVED);
    const { user, onRated, onClose } = renderModal();

    await user.click(screen.getByRole('radio', { name: '4 stars' }));
    await user.type(screen.getByLabelText('Comment (optional)'), '  Sweet yams  ');
    await user.click(screen.getByRole('button', { name: 'Submit rating' }));

    expect(mocked.rate).toHaveBeenCalledWith({ orderId: 'order-1', farmerId: 'f-kofi', score: 4, comment: 'Sweet yams' });
    expect(toast.success).toHaveBeenCalledWith('Thanks! You rated Kofi Boateng 4 out of 5.');
    expect(onRated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('sends no comment when it is left empty', async () => {
    mocked.rate.mockResolvedValue(SAVED);
    const { user } = renderModal();

    await user.click(screen.getByRole('radio', { name: '1 star' }));
    await user.click(screen.getByRole('button', { name: 'Submit rating' }));

    expect(mocked.rate).toHaveBeenCalledWith({ orderId: 'order-1', farmerId: 'f-kofi', score: 1, comment: undefined });
  });

  it('on a duplicate (409), shows a toast and refreshes to the existing rating', async () => {
    mocked.rate.mockRejectedValue(new ApiError("You've already rated this farmer for this order.", 409, 'ALREADY_RATED'));
    const { user, onRated, onClose } = renderModal();

    await user.click(screen.getByRole('radio', { name: '5 stars' }));
    await user.click(screen.getByRole('button', { name: 'Submit rating' }));

    expect(toast.error).toHaveBeenCalledWith("You've already rated this farmer for this order.");
    expect(onRated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the dialog open with the message on other errors', async () => {
    mocked.rate.mockRejectedValue(new ApiError('You can rate farmers once the order is completed.', 422, 'ORDER_NOT_COMPLETED'));
    const { user, onClose } = renderModal();

    await user.click(screen.getByRole('radio', { name: '3 stars' }));
    await user.click(screen.getByRole('button', { name: 'Submit rating' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('You can rate farmers once the order is completed.');
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('Rating from My orders', () => {
  function summary(overrides: Partial<OrderSummary>): OrderSummary {
    return {
      id: 'order-1',
      orderNumber: 'CM-00000001',
      createdAt: '2026-10-24T14:30:00Z',
      finalTotalCents: 4500,
      status: 'COMPLETED',
      fulfillmentType: 'PICKUP',
      itemCount: 2,
      farmersToRate: [],
      ...overrides,
    };
  }
  const page = (content: OrderSummary[]) => ({ content, currentPage: 0, totalPages: 1, totalElements: content.length, size: 10 });

  it('offers Rate only for completed orders with unrated farmers, and removes it once rated', async () => {
    mocked.list
      .mockResolvedValueOnce(page([summary({ farmersToRate: [KOFI] }), summary({ id: 'order-2', orderNumber: 'CM-00000002', status: 'PENDING' })]))
      .mockResolvedValue(page([summary({}), summary({ id: 'order-2', orderNumber: 'CM-00000002', status: 'PENDING' })]));
    mocked.rate.mockResolvedValue(SAVED);
    const user = userEvent.setup();
    render(<OrderHistory />, { wrapper });

    const list = await screen.findByRole('list', { name: 'Your orders' });
    const [completed, pending] = within(list).getAllByRole('listitem');
    expect(within(pending).queryByRole('button')).not.toBeInTheDocument();

    await user.click(within(completed).getByRole('button', { name: 'Rate Kofi Boateng' }));
    const dialog = screen.getByRole('dialog', { name: 'Rate Kofi Boateng' });
    await user.click(within(dialog).getByRole('radio', { name: '4 stars' }));
    await user.click(within(dialog).getByRole('button', { name: 'Submit rating' }));

    expect(mocked.rate).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'order-1', farmerId: 'f-kofi', score: 4 }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Rate Kofi Boateng' })).not.toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Rating from the order page', () => {
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
    farmers: [{ ...AMA, rating: { ...SAVED, farmerId: AMA.farmerId, score: 5, comment: 'Lovely okro' } }, KOFI],
  };

  it('shows each farmer with the buyer’s rating, or a button to rate them', async () => {
    mocked.get.mockResolvedValue(ORDER);
    render(<OrderConfirmation orderId="order-1" variant="detail" />, { wrapper });

    const section = await screen.findByRole('region', { name: 'Rate your farmers' });
    const [ama, kofi] = within(section).getAllByRole('listitem');
    expect(ama).toHaveTextContent('Ama Mensah');
    expect(ama).toHaveTextContent('You rated 5 out of 5');
    expect(ama).toHaveTextContent('“Lovely okro”');
    expect(within(ama).queryByRole('button')).not.toBeInTheDocument();
    expect(within(kofi).getByRole('button', { name: 'Rate Kofi Boateng' })).toBeInTheDocument();
  });

  it('shows the new rating after submitting', async () => {
    mocked.get
      .mockResolvedValueOnce(ORDER)
      .mockResolvedValue({ ...ORDER, farmers: [ORDER.farmers[0], { ...KOFI, rating: SAVED }] });
    mocked.rate.mockResolvedValue(SAVED);
    const user = userEvent.setup();
    render(<OrderConfirmation orderId="order-1" variant="detail" />, { wrapper });

    await user.click(await screen.findByRole('button', { name: 'Rate Kofi Boateng' }));
    await user.click(screen.getByRole('radio', { name: '4 stars' }));
    await user.click(screen.getByRole('button', { name: 'Submit rating' }));

    expect(await screen.findByText('You rated 4 out of 5')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rate Kofi Boateng' })).not.toBeInTheDocument();
  });

  it('has no rating section until the order is completed', async () => {
    mocked.get.mockResolvedValue({ ...ORDER, status: 'READY_FOR_PICKUP' });
    render(<OrderConfirmation orderId="order-1" variant="detail" />, { wrapper });

    await screen.findByRole('heading', { name: 'Order CM-7K3F9Q2X' });
    expect(screen.queryByRole('region', { name: /Rate your/ })).not.toBeInTheDocument();
  });
});
