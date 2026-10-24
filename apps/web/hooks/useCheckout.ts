import useSWR from 'swr';
import type { RegionCode } from '@cheap-market/shared-types';

import { getDeliveryFee, listPickupLocations } from '@/services/checkoutService';

export function useDeliveryFee(region: RegionCode | null) {
  return useSWR(region ? ['delivery-fee', region] : null, () => getDeliveryFee(region!));
}

export function usePickupLocations(region: RegionCode | null) {
  return useSWR(region ? ['pickup-locations', region] : null, () => listPickupLocations(region!));
}
