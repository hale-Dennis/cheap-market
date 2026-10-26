import type {
  OrderDetail,
  OrderStatusCounts,
  OrderStatusGroup,
  OrderSummary,
  PaginatedResponse,
  PlacedOrder,
  PlaceOrderRequest,
} from '@cheap-market/shared-types';

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

export const ORDERS_PAGE_SIZE = 10;

/**
 * The buyer's orders, newest first.
 * @param page Zero-based.
 * @param status Only one order-history tab; every order when not given.
 */
export function listOrders(page = 0, status?: OrderStatusGroup): Promise<PaginatedResponse<OrderSummary>> {
  const params = new URLSearchParams({ page: String(page), size: String(ORDERS_PAGE_SIZE) });
  if (status) params.set('status', status);
  return apiRequest<PaginatedResponse<OrderSummary>>(`/orders?${params}`);
}

/** How many of the buyer's orders are in each order-history tab. */
export function countOrders(): Promise<OrderStatusCounts> {
  return apiRequest<OrderStatusCounts>('/orders/status-counts');
}

export function getOrder(orderId: string): Promise<OrderDetail> {
  return apiRequest<OrderDetail>(`/orders/${encodeURIComponent(orderId)}`);
}
