import type {
  BuyerProfile,
  UpdateBuyerProfileRequest,
} from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

export function getBuyerProfile(): Promise<BuyerProfile> {
  return apiRequest<BuyerProfile>('/buyer/profile');
}

export function updateBuyerProfile(
  request: UpdateBuyerProfileRequest,
): Promise<BuyerProfile> {
  return apiRequest<BuyerProfile>('/buyer/profile', {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}
