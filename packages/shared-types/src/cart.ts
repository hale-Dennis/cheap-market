/** Request body for POST /cart: sets the quantity of a product in the buyer's cart. */
export interface SetCartItemRequest {
  productId: string;
  /** 1–99. */
  quantity: number;
}

export const MAX_CART_QUANTITY = 99;

/** A line in the cart (see CartItemDto.java). */
export interface CartItem {
  productId: string;
  name: string;
  unit: string;
  farmerName: string;
  /** Current price per unit. */
  priceCents: number;
  quantity: number;
  lineTotalCents: number;
  primaryImageUrl: string | null;
  /** False once the listing is no longer for sale; it can then only be removed. */
  available: boolean;
}

/** Response of the /cart endpoints (see CartResponseDto.java). */
export interface Cart {
  /** In the order they were added. */
  items: CartItem[];
  /** Sum of quantities, including unavailable items. */
  totalItems: number;
  /** Total of available items at current prices. */
  subtotalCents: number;
}
