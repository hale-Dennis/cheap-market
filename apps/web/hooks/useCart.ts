import useSWR, { useSWRConfig } from 'swr';
import { MAX_CART_QUANTITY, type Cart, type CartItem } from '@cheap-market/shared-types';

import { clearCart, getCart, removeCartItem, setCartItem } from '@/services/cartService';

export const CART_KEY = 'buyer/cart';

/** The buyer's cart, shared by every component that shows it. Pass enabled=false for non-buyers. */
export function useCart(enabled: boolean) {
  return useSWR(enabled ? CART_KEY : null, getCart);
}

/** Recomputes totals the way the API does, for optimistic updates. */
function withItems(items: CartItem[]): Cart {
  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: items.filter((item) => item.available).reduce((sum, item) => sum + item.lineTotalCents, 0),
  };
}

function setQuantityLocally(cart: Cart | undefined, productId: string, quantity: number): Cart | undefined {
  if (!cart) return cart;
  return withItems(
    cart.items.map((item) =>
      item.productId === productId ? { ...item, quantity, lineTotalCents: item.priceCents * quantity } : item,
    ),
  );
}

// Cart writes are sent one at a time: two quick "+" clicks must reach the server in order,
// or it could end up storing the older quantity.
let writeQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(write: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(write, write);
  writeQueue = result.catch(() => undefined);
  return result;
}

/**
 * Cart actions shared across the app. Each updates the cached cart immediately (rolling back if the
 * API refuses) and then stores the API's version. Errors are re-thrown for the caller to show.
 */
export function useCartActions() {
  const { mutate } = useSWRConfig();

  function update(write: () => Promise<Cart>, optimistic?: (cart: Cart | undefined) => Cart | undefined) {
    return mutate<Cart>(CART_KEY, enqueue(write), {
      optimisticData: optimistic ? (current?: Cart) => optimistic(current) as Cart : undefined,
      rollbackOnError: true,
      populateCache: true,
      revalidate: false,
    });
  }

  return {
    /** Adds `quantity` to whatever is already in the cart (capped at 99). Returns the new quantity. */
    async addItem(productId: string, quantity: number, current: Cart | undefined): Promise<number> {
      const existing = current?.items.find((item) => item.productId === productId)?.quantity ?? 0;
      const total = Math.min(existing + quantity, MAX_CART_QUANTITY);
      await update(() => setCartItem({ productId, quantity: total }));
      return total;
    },
    updateQuantity(productId: string, quantity: number) {
      return update(
        () => setCartItem({ productId, quantity }),
        (cart) => setQuantityLocally(cart, productId, quantity),
      );
    },
    removeItem(productId: string) {
      return update(
        () => removeCartItem(productId),
        (cart) => cart && withItems(cart.items.filter((item) => item.productId !== productId)),
      );
    },
    clearCart() {
      return update(() => clearCart(), () => withItems([]));
    },
  };
}
