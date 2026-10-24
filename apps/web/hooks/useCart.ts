import useSWR from 'swr';

import { getCart } from '@/services/cartService';

export const CART_KEY = 'buyer/cart';

/** The buyer's cart, shared by every component that shows it. Pass enabled=false for non-buyers. */
export function useCart(enabled: boolean) {
  return useSWR(enabled ? CART_KEY : null, getCart);
}
