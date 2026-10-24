import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';
import type { BuyerProfile, Cart, CartItem, PickupLocation } from '@cheap-market/shared-types';

import { CartView } from '../components/cart/CartView';
import { CheckoutView } from '../components/checkout/CheckoutView';
import { checkoutTotals, selectionError } from '../lib/checkout';
import { getBuyerProfile } from '../services/buyerService';
import { getCart } from '../services/cartService';
import { getDeliveryFee, listPickupLocations } from '../services/checkoutService';

jest.mock('../services/cartService', () => ({
  getCart: jest.fn(),
  setCartItem: jest.fn(),
  removeCartItem: jest.fn(),
  clearCart: jest.fn(),
}));
jest.mock('../services/buyerService', () => ({ getBuyerProfile: jest.fn(), updateBuyerProfile: jest.fn() }));
jest.mock('../services/checkoutService', () => ({ getDeliveryFee: jest.fn(), listPickupLocations: jest.fn() }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

const mocked = {
  cart: getCart as jest.MockedFunction<typeof getCart>,
  profile: getBuyerProfile as jest.MockedFunction<typeof getBuyerProfile>,
  fee: getDeliveryFee as jest.MockedFunction<typeof getDeliveryFee>,
  pickups: listPickupLocations as jest.MockedFunction<typeof listPickupLocations>,
};
const { toast } = jest.requireMock('sonner') as { toast: { error: jest.Mock } };

function item(name: string, priceCents: number, quantity: number, available = true): CartItem {
  return {
    productId: `p-${name}`,
    name,
    unit: 'per kg',
    farmerName: 'Ama Mensah',
    priceCents,
    quantity,
    lineTotalCents: priceCents * quantity,
    primaryImageUrl: null,
    available,
  };
}

function cartOf(...items: CartItem[]): Cart {
  return {
    items,
    totalItems: items.reduce((s, i) => s + i.quantity, 0),
    subtotalCents: items.filter((i) => i.available).reduce((s, i) => s + i.lineTotalCents, 0),
  };
}

const PROFILE: BuyerProfile = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  region: 'VOLTA',
  deliveryAddress: { street: '12 Ring Rd', town: 'Ho', gpsAddress: 'VH-123-4567' },
};

const HO_MARKET: PickupLocation = {
  id: 'loc-ho',
  name: 'Ho Central Market',
  address: { street: 'Market Rd', town: 'Ho', gpsAddress: null },
  region: 'VOLTA',
  operatingHours: 'Mon–Sat 7am–6pm',
};
const HOHOE: PickupLocation = { ...HO_MARKET, id: 'loc-hohoe', name: 'Hohoe Lorry Station' };

function wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>;
}

function setUp({
  cart = cartOf(item('Okro', 5000, 2)),
  profile = PROFILE,
  pickups = [HO_MARKET, HOHOE],
}: { cart?: Cart; profile?: BuyerProfile; pickups?: PickupLocation[] } = {}) {
  mocked.cart.mockResolvedValue(cart);
  mocked.profile.mockResolvedValue(profile);
  mocked.fee.mockResolvedValue({ region: 'VOLTA', feeCents: 1000 });
  mocked.pickups.mockResolvedValue(pickups);
  const onPlaceOrder = jest.fn();
  const user = userEvent.setup();
  render(<CheckoutView onPlaceOrder={onPlaceOrder} />, { wrapper });
  return { onPlaceOrder, user };
}

const total = () => screen.getByText('Total').nextElementSibling;
const deliveryLine = () => screen.getByText(/^(Delivery|Pickup)$/).nextElementSibling;

beforeEach(() => {
  Object.values(mocked).forEach((fn) => fn.mockReset());
  toast.error.mockReset();
});

describe('checkout helpers', () => {
  it('adds the delivery fee only for home delivery', () => {
    expect(checkoutTotals(10000, null, 1000)).toEqual({ deliveryFeeCents: null, totalCents: 10000 });
    expect(checkoutTotals(10000, 'DELIVERY', 1000)).toEqual({ deliveryFeeCents: 1000, totalCents: 11000 });
    expect(checkoutTotals(10000, 'PICKUP', 1000)).toEqual({ deliveryFeeCents: 0, totalCents: 10000 });
  });

  it('requires a method, and a location for pickup', () => {
    expect(selectionError({ type: null, pickupLocationId: null })).toBe('Choose home delivery or a pickup point.');
    expect(selectionError({ type: 'PICKUP', pickupLocationId: null })).toBe('Choose a pickup point.');
    expect(selectionError({ type: 'PICKUP', pickupLocationId: 'loc-ho' })).toBeNull();
    expect(selectionError({ type: 'DELIVERY', pickupLocationId: null })).toBeNull();
  });
});

describe('CheckoutView', () => {
  it('summarises the order and waits for a fulfillment choice', async () => {
    setUp({ cart: cartOf(item('Okro', 5000, 2), item('Mango', 1250, 1)) });

    expect(await screen.findByRole('group', { name: 'How would you like to get your order?' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Items' })).toHaveTextContent('Okro × 2GH₵ 100.00');
    expect(deliveryLine()).toHaveTextContent('Choose an option');
    expect(total()).toHaveTextContent('GH₵ 112.50');
    expect(mocked.pickups).toHaveBeenCalledWith('VOLTA');
    expect(mocked.fee).toHaveBeenCalledWith('VOLTA');
  });

  it('home delivery uses the profile address and adds the delivery fee', async () => {
    const { user } = setUp();
    await screen.findByLabelText(/Home delivery/);
    await waitFor(() => expect(screen.getByText('GH₵ 10.00')).toBeInTheDocument());

    await user.click(screen.getByLabelText(/Home delivery/));

    expect(screen.getByText('12 Ring Rd, Ho, VH-123-4567')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Change address' })).toHaveAttribute('href', '/buyer/profile');
    expect(deliveryLine()).toHaveTextContent('GH₵ 10.00');
    expect(total()).toHaveTextContent('GH₵ 110.00');
  });

  it('pickup is free and lets the buyer choose a location in their region', async () => {
    const { user, onPlaceOrder } = setUp();
    await waitFor(() => expect(screen.getByLabelText(/Collect from a pickup point/)).toBeEnabled());

    await user.click(screen.getByLabelText(/Collect from a pickup point/));
    await user.selectOptions(screen.getByLabelText('Pickup point'), 'loc-ho');

    expect(screen.getByText(/Market Rd, Ho · Open Mon–Sat 7am–6pm/)).toBeInTheDocument();
    expect(deliveryLine()).toHaveTextContent('Free');
    expect(total()).toHaveTextContent('GH₵ 100.00');

    await user.click(screen.getByRole('button', { name: 'Place order' }));
    expect(onPlaceOrder).toHaveBeenCalledWith({ type: 'PICKUP', pickupLocationId: 'loc-ho' });
  });

  it('switching between options recalculates the total', async () => {
    const { user } = setUp();
    await waitFor(() => expect(screen.getByLabelText(/Collect from a pickup point/)).toBeEnabled());
    await waitFor(() => expect(screen.getByText('GH₵ 10.00')).toBeInTheDocument());

    await user.click(screen.getByLabelText(/Home delivery/));
    expect(total()).toHaveTextContent('GH₵ 110.00');
    await user.click(screen.getByLabelText(/Collect from a pickup point/));
    expect(total()).toHaveTextContent('GH₵ 100.00');
  });

  it('shows an error instead of continuing without a choice', async () => {
    const { user, onPlaceOrder } = setUp();
    await screen.findByLabelText(/Home delivery/);

    await user.click(screen.getByRole('button', { name: 'Place order' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Choose home delivery or a pickup point.');
    expect(toast.error).toHaveBeenCalledWith('Choose home delivery or a pickup point.');
    expect(onPlaceOrder).not.toHaveBeenCalled();

    // Fixing the problem clears the error.
    await user.click(screen.getByLabelText(/Home delivery/));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('requires a pickup point when collecting', async () => {
    const { user, onPlaceOrder } = setUp();
    await waitFor(() => expect(screen.getByLabelText(/Collect from a pickup point/)).toBeEnabled());

    await user.click(screen.getByLabelText(/Collect from a pickup point/));
    await user.click(screen.getByRole('button', { name: 'Place order' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a pickup point.');
    expect(onPlaceOrder).not.toHaveBeenCalled();
  });

  it('places a home-delivery order', async () => {
    const { user, onPlaceOrder } = setUp();
    await screen.findByLabelText(/Home delivery/);

    await user.click(screen.getByLabelText(/Home delivery/));
    await user.click(screen.getByRole('button', { name: 'Place order' }));

    expect(onPlaceOrder).toHaveBeenCalledWith({ type: 'DELIVERY', pickupLocationId: null });
  });

  it('disables home delivery until the buyer has a delivery address', async () => {
    setUp({ profile: { ...PROFILE, deliveryAddress: null } });

    expect(await screen.findByLabelText(/Home delivery/)).toBeDisabled();
    expect(screen.getByRole('link', { name: 'profile' })).toHaveAttribute('href', '/buyer/profile');
  });

  it('disables pickup when the region has no pickup points', async () => {
    setUp({ pickups: [] });

    expect(await screen.findByText('There are no pickup points in Volta yet. Choose home delivery instead.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Collect from a pickup point/)).toBeDisabled();
  });

  it('blocks checkout while the cart has unavailable items', async () => {
    setUp({ cart: cartOf(item('Okro', 5000, 2), item('Mango', 1250, 1, false)) });

    expect(await screen.findByRole('heading', { name: 'Some items are no longer available' })).toBeInTheDocument();
    expect(screen.getByText('Remove Mango from your cart to continue.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place order' })).not.toBeInTheDocument();
  });

  it('sends buyers with an empty cart back to the catalog', async () => {
    setUp({ cart: cartOf() });

    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse produce' })).toHaveAttribute('href', '/products');
  });
});

describe('Cart → checkout', () => {
  it('links to checkout, but not while items are unavailable', async () => {
    mocked.cart.mockResolvedValue(cartOf(item('Okro', 5000, 2)));
    const { unmount } = render(<CartView />, { wrapper });
    expect(await screen.findByRole('link', { name: 'Proceed to checkout' })).toHaveAttribute('href', '/checkout');
    unmount();

    mocked.cart.mockResolvedValue(cartOf(item('Okro', 5000, 2), item('Mango', 1250, 1, false)));
    render(<CartView />, { wrapper });
    const button = await screen.findByRole('button', { name: 'Proceed to checkout' });
    expect(button).toBeDisabled();
    expect(within(document.body).getByText(/Remove it to check out/)).toBeInTheDocument();
  });
});
