import type { Address } from './buyer';

export type FulfillmentType = 'DELIVERY' | 'PICKUP';

/** A place buyers can collect orders (see PickupLocationResponseDto.java). */
export interface PickupLocation {
  id: string;
  name: string;
  address: Address;
  region: string;
  operatingHours: string | null;
}

/** Response of GET /delivery-fees?region= (see DeliveryFeeResponse.java). */
export interface DeliveryFee {
  region: string;
  /** Flat home-delivery fee in pesewas. */
  feeCents: number;
}
