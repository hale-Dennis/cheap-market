import type {
  CreateFarmerRequest,
  Farmer,
  PaginatedResponse,
} from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

/** Matches the API default; it accepts up to 100. */
export const FARMERS_PAGE_SIZE = 20;

export function createFarmer(request: CreateFarmerRequest): Promise<Farmer> {
  return apiRequest<Farmer>('/admin/farmers', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Fetches one page of farmers, newest first (the API fixes the order).
 * @param page Zero-based page number.
 */
export function listFarmers(
  page = 0,
  size = FARMERS_PAGE_SIZE,
): Promise<PaginatedResponse<Farmer>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiRequest<PaginatedResponse<Farmer>>(`/admin/farmers?${params}`);
}
