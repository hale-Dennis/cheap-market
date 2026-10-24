import type { CreateRatingRequest, FarmerRatingSummary, Rating } from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

/** Rates one farmer from one of the buyer's completed orders. */
export function createRating(request: CreateRatingRequest): Promise<Rating> {
  return apiRequest<Rating>('/ratings', { method: 'POST', body: JSON.stringify(request) });
}

export function getFarmerRating(farmerId: string): Promise<FarmerRatingSummary> {
  return apiRequest<FarmerRatingSummary>(`/ratings?farmerId=${encodeURIComponent(farmerId)}`);
}
