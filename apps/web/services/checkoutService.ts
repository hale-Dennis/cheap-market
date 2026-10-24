import type { DeliveryFee, PickupLocation, RegionCode } from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

/** The flat home-delivery fee for a region (public). */
export function getDeliveryFee(region: RegionCode): Promise<DeliveryFee> {
  return apiRequest<DeliveryFee>(`/delivery-fees?${new URLSearchParams({ region })}`);
}

/** Pickup locations in a region, by name (buyers only). */
export function listPickupLocations(region: RegionCode): Promise<PickupLocation[]> {
  return apiRequest<PickupLocation[]>(`/pickup-locations?${new URLSearchParams({ region })}`);
}
