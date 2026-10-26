import type { AdminStats, PublicStats } from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

/** Farmers selling and regions covered. Public: no sign-in needed. */
export function getPublicStats(): Promise<PublicStats> {
  return apiRequest<PublicStats>('/stats');
}

/** Farmers, live listings, orders in progress and open disputes. Admins only. */
export function getAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>('/admin/stats');
}
