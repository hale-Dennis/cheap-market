import type { Address } from './buyer';
import type { FulfillmentType, PickupLocation } from './checkout';
import type { Dispute } from './dispute';
import type { Rating } from './rating';

export type OrderStatus = 'PENDING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'DISPUTED';
export type PaymentStatus = 'UNPAID' | 'PAID';

/** Request body for POST /orders. Send an Idempotency-Key header too, the same for retries. */
export interface PlaceOrderRequest {
  fulfillmentType: FulfillmentType;
  /** Required for PICKUP. */
  pickupLocationId?: string;
}

/** Response of POST /orders (see PlaceOrderResponseDto.java). */
export interface PlacedOrder {
  orderId: string;
  /** Short reference for buyers, e.g. CM-7K3F9Q2X. */
  orderNumber: string;
  /** True when this repeated an earlier request; no new order was created. */
  duplicate: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  priceAtPurchaseCents: number;
  lineTotalCents: number;
}

/** Response of GET /orders/{id} (see OrderConfirmationResponse.java). */
export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  itemsSubtotalCents: number;
  deliveryFeeCents: number;
  finalTotalCents: number;
  fulfillmentType: FulfillmentType;
  deliveryAddress: Address | null;
  pickupLocation: PickupLocation | null;
  createdAt: string;
  /** Each farmer who supplied the order, with the buyer's rating of them if given. */
  farmers: OrderFarmer[];
  /** The issue the buyer reported, if any. */
  dispute: Dispute | null;
}

/** A farmer in an order (see OrderFarmerDto.java). */
export interface OrderFarmer {
  farmerId: string;
  fullName: string;
  /** Null until the buyer rates this farmer for the order (always null in farmersToRate). */
  rating: Rating | null;
}

/** Error codes from POST /orders that the checkout handles. */
export type PlaceOrderErrorCode =
  | 'EMPTY_CART'
  | 'UNAVAILABLE_ITEMS'
  | 'PICKUP_LOCATION_REQUIRED'
  | 'PICKUP_LOCATION_OUT_OF_REGION'
  | 'DELIVERY_ADDRESS_REQUIRED';

/** An admin notification (see NotificationResponse.java). */
export interface AdminNotification {
  id: string;
  type: 'NEW_ORDER' | 'DISPUTE_OPENED';
  message: string;
  orderId: string | null;
  createdAt: string;
  read: boolean;
}

export interface AdminNotifications {
  unreadCount: number;
  /** Newest first. */
  notifications: AdminNotification[];
}

/** One row of the buyer's order history (see OrderSummaryResponseDto.java). */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  createdAt: string;
  finalTotalCents: number;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  /** Total quantity across the order's items. */
  itemCount: number;
  /** Farmers the buyer can still rate; empty unless the order is completed (or disputed). */
  farmersToRate: OrderFarmer[];
}
