/** Request body for POST /cart: sets the quantity of a product in the buyer's cart. */
export interface SetCartItemRequest {
  productId: string;
  /** 1–99. */
  quantity: number;
}

/** A line in the cart (see CartItemDto.java). */
export interface CartItem {
  productId: string;
  name: string;
  priceCentsAtAdd: number;
  quantity: number;
  primaryImageUrl: string | null;
}

/** Response of the /cart endpoints (see CartResponseDto.java). */
export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotalCents: number;
}
