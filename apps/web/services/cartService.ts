import type { Cart, SetCartItemRequest } from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

/** The signed-in buyer's cart. */
export function getCart(): Promise<Cart> {
  return apiRequest<Cart>('/cart');
}

/** Puts a product in the cart with the given quantity (replacing any previous quantity). */
export function setCartItem(request: SetCartItemRequest): Promise<Cart> {
  return apiRequest<Cart>('/cart', { method: 'POST', body: JSON.stringify(request) });
}
