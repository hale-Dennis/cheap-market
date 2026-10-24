import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';
import type { Cart, CartItem } from '@cheap-market/shared-types';

import { CartView } from '../components/cart/CartView';
import { QuantityStepper } from '../components/cart/QuantityStepper';
import { useCartActions } from '../hooks/useCart';
import { ApiError } from '../services/apiClient';
import { clearCart, getCart, removeCartItem, setCartItem } from '../services/cartService';

jest.mock('../services/cartService', () => ({
  getCart: jest.fn(),
  setCartItem: jest.fn(),
  removeCartItem: jest.fn(),
  clearCart: jest.fn(),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mocked = {
  get: getCart as jest.MockedFunction<typeof getCart>,
  set: setCartItem as jest.MockedFunction<typeof setCartItem>,
  remove: removeCartItem as jest.MockedFunction<typeof removeCartItem>,
  clear: clearCart as jest.MockedFunction<typeof clearCart>,
};
const { toast } = jest.requireMock('sonner') as { toast: { success: jest.Mock; error: jest.Mock } };

function item(id: string, name: string, priceCents: number, quantity: number, available = true): CartItem {
  return {
    productId: id,
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
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotalCents: items.filter((i) => i.available).reduce((sum, i) => sum + i.lineTotalCents, 0),
  };
}

const OKRO = item('p-okro', 'Okro', 5000, 2);
const MANGO = item('p-mango', 'Mango', 1000, 3);

function wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>;
}

/** A promise we resolve by hand, to hold an API call "in flight". */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  Object.values(mocked).forEach((fn) => fn.mockReset());
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('QuantityStepper', () => {
  it('steps within 1–99 and applies typed values on Enter', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    const { rerender } = render(<QuantityStepper itemName="Okro" value={1} onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Decrease quantity of Okro' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Increase quantity of Okro' }));
    expect(onChange).toHaveBeenLastCalledWith(2);

    const input = screen.getByRole('spinbutton', { name: 'Quantity of Okro' });
    await user.clear(input);
    await user.type(input, '12{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(12);

    rerender(<QuantityStepper itemName="Okro" value={99} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Increase quantity of Okro' })).toBeDisabled();
  });

  it('puts back the previous quantity when the typed value is invalid', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<QuantityStepper itemName="Okro" value={4} onChange={onChange} />);

    const input = screen.getByRole('spinbutton', { name: 'Quantity of Okro' });
    await user.clear(input);
    await user.type(input, '150');
    await user.tab();

    expect(input).toHaveValue(4);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('useCartActions', () => {
  it('adds to the quantity already in the cart, capped at 99', async () => {
    mocked.set.mockResolvedValue(cartOf());
    const { result } = renderHook(() => useCartActions(), { wrapper });

    await act(async () => {
      expect(await result.current.addItem('p-okro', 3, cartOf(OKRO))).toBe(5);
      expect(await result.current.addItem('p-new', 4, cartOf(OKRO))).toBe(4);
      expect(await result.current.addItem('p-okro', 98, cartOf(OKRO))).toBe(99);
    });

    expect(mocked.set.mock.calls.map(([request]) => request)).toEqual([
      { productId: 'p-okro', quantity: 5 },
      { productId: 'p-new', quantity: 4 },
      { productId: 'p-okro', quantity: 99 },
    ]);
  });

  it('sends writes one at a time, in order', async () => {
    const first = deferred<Cart>();
    mocked.set.mockReturnValueOnce(first.promise).mockResolvedValueOnce(cartOf());
    const { result } = renderHook(() => useCartActions(), { wrapper });

    let done: Promise<unknown>;
    act(() => {
      done = Promise.all([result.current.updateQuantity('p-okro', 3), result.current.updateQuantity('p-okro', 4)]);
    });
    // The second write waits for the first.
    await waitFor(() => expect(mocked.set).toHaveBeenCalledTimes(1));
    expect(mocked.set).toHaveBeenLastCalledWith({ productId: 'p-okro', quantity: 3 });

    await act(async () => {
      first.resolve(cartOf());
      await done;
    });
    expect(mocked.set).toHaveBeenCalledTimes(2);
    expect(mocked.set).toHaveBeenLastCalledWith({ productId: 'p-okro', quantity: 4 });
  });
});

describe('CartView', () => {
  function renderCart() {
    const user = userEvent.setup();
    render(<CartView />, { wrapper });
    return user;
  }

  const rowFor = (name: string) =>
    screen.getAllByRole('listitem').find((row) => within(row).queryByRole('link', { name }))!;

  it('lists items with unit price, quantity, line total and the subtotal', async () => {
    mocked.get.mockResolvedValue(cartOf(OKRO, MANGO));
    renderCart();

    const okro = await waitFor(() => rowFor('Okro'));
    expect(okro).toHaveTextContent('GH₵ 50.00 per kg · Ama Mensah');
    expect(within(okro).getByRole('spinbutton', { name: 'Quantity of Okro' })).toHaveValue(2);
    expect(okro).toHaveTextContent('GH₵ 100.00');
    expect(screen.getByText('Items (5)')).toBeInTheDocument();
    expect(screen.getByText('Subtotal').nextElementSibling).toHaveTextContent('GH₵ 130.00');
  });

  it('updates the total immediately when the quantity changes, then saves it', async () => {
    const saving = deferred<Cart>();
    mocked.get.mockResolvedValue(cartOf(OKRO));
    mocked.set.mockReturnValue(saving.promise);
    const user = renderCart();
    await screen.findByRole('link', { name: 'Okro' });

    await user.click(screen.getByRole('button', { name: 'Increase quantity of Okro' }));

    // Optimistic: shown before the API answers.
    expect(screen.getByRole('spinbutton', { name: 'Quantity of Okro' })).toHaveValue(3);
    expect(screen.getByText('Subtotal').nextElementSibling).toHaveTextContent('GH₵ 150.00');
    expect(mocked.set).toHaveBeenCalledWith({ productId: 'p-okro', quantity: 3 });
    await act(async () => saving.resolve(cartOf({ ...OKRO, quantity: 3, lineTotalCents: 15000 })));
  });

  it('rolls back and explains when the API refuses a change', async () => {
    mocked.get.mockResolvedValue(cartOf(OKRO));
    mocked.set.mockRejectedValue(new ApiError('This product is no longer available and cannot be added to the cart.', 422));
    const user = renderCart();
    await screen.findByRole('link', { name: 'Okro' });

    await user.click(screen.getByRole('button', { name: 'Increase quantity of Okro' }));

    await waitFor(() => expect(screen.getByRole('spinbutton', { name: 'Quantity of Okro' })).toHaveValue(2));
    expect(toast.error).toHaveBeenCalledWith('This product is no longer available and cannot be added to the cart.');
  });

  it('removes an item', async () => {
    mocked.get.mockResolvedValue(cartOf(OKRO, MANGO));
    mocked.remove.mockResolvedValue(cartOf(MANGO));
    const user = renderCart();
    await screen.findByRole('link', { name: 'Okro' });

    await user.click(screen.getByRole('button', { name: 'Remove Okro' }));

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Okro' })).not.toBeInTheDocument());
    expect(mocked.remove).toHaveBeenCalledWith('p-okro');
    expect(toast.success).toHaveBeenCalledWith('Okro removed from your cart.');
  });

  it('flags items that are no longer available and leaves them out of the subtotal', async () => {
    mocked.get.mockResolvedValue(cartOf(OKRO, item('p-mango', 'Mango', 1000, 3, false)));
    renderCart();

    const mango = await waitFor(() => rowFor('Mango'));
    expect(mango).toHaveTextContent('No longer available. Remove it to continue.');
    expect(within(mango).getByRole('button', { name: 'Increase quantity of Mango' })).toBeDisabled();
    expect(within(mango).getByRole('button', { name: 'Remove Mango' })).toBeEnabled();
    expect(screen.getByText(/1 item is no longer available/)).toBeInTheDocument();
    expect(screen.getByText('Items (2)')).toBeInTheDocument();
    expect(screen.getByText('Subtotal').nextElementSibling).toHaveTextContent('GH₵ 100.00');
  });

  it('shows the empty cart with a way back to the catalog', async () => {
    mocked.get.mockResolvedValue(cartOf());
    renderCart();

    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse produce' })).toHaveAttribute('href', '/products');
  });

  it('empties the cart after confirmation', async () => {
    mocked.get.mockResolvedValue(cartOf(OKRO, MANGO));
    mocked.clear.mockResolvedValue(cartOf());
    const user = renderCart();
    await screen.findByRole('link', { name: 'Okro' });

    await user.click(screen.getByRole('button', { name: 'Empty cart' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Empty your cart?' });
    expect(dialog).toHaveTextContent('This removes all 2 items from your cart.');
    await user.click(within(dialog).getByRole('button', { name: 'Empty cart' }));

    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
    expect(mocked.clear).toHaveBeenCalled();
  });
});
