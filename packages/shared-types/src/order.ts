import type { Address } from './buyer';
import type { FulfillmentType, PickupLocation } from './checkout';

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
  type: 'NEW_ORDER';
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
