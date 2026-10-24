import type { OrderDetail, PlacedOrder, PlaceOrderRequest } from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

/**
 * Places an order from the buyer's cart.
 * @param idempotencyKey The same for every retry of one checkout, so a repeat can't create a second order.
 */
export function placeOrder(request: PlaceOrderRequest, idempotencyKey: string): Promise<PlacedOrder> {
  return apiRequest<PlacedOrder>('/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(request),
  });
}

export function getOrder(orderId: string): Promise<OrderDetail> {
  return apiRequest<OrderDetail>(`/orders/${encodeURIComponent(orderId)}`);
}
