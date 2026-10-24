import type { FulfillmentType } from '@cheap-market/shared-types';

export interface FulfillmentSelection {
  type: FulfillmentType | null;
  pickupLocationId: string | null;
}

export interface CheckoutTotals {
  /** Null until a fulfillment method is chosen. */
  deliveryFeeCents: number | null;
  totalCents: number;
}

/** Home delivery adds the region's flat fee; pickup is free. */
export function checkoutTotals(subtotalCents: number, type: FulfillmentType | null, deliveryFeeCents: number): CheckoutTotals {
  if (type === null) return { deliveryFeeCents: null, totalCents: subtotalCents };
  const fee = type === 'DELIVERY' ? deliveryFeeCents : 0;
  return { deliveryFeeCents: fee, totalCents: subtotalCents + fee };
}

/** Why the selection can't be submitted yet, or null when it's complete. */
export function selectionError(selection: FulfillmentSelection): string | null {
  if (selection.type === null) return 'Choose home delivery or a pickup point.';
  if (selection.type === 'PICKUP' && !selection.pickupLocationId) return 'Choose a pickup point.';
  return null;
}
