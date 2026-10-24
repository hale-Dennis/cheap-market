import type {
  CreateFarmerRequest,
  Farmer,
  PaginatedResponse,
} from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

export function createFarmer(request: CreateFarmerRequest): Promise<Farmer> {
  return apiRequest<Farmer>('/admin/farmers', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function listFarmers(page = 0, size = 20): Promise<PaginatedResponse<Farmer>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'createdAt,desc',
  });
  return apiRequest<PaginatedResponse<Farmer>>(`/admin/farmers?${params}`);
}
