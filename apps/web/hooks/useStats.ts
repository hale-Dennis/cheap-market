import useSWR from 'swr';

import { getAdminStats, getPublicStats } from '@/services/statsService';

export function usePublicStats() {
  return useSWR('stats', getPublicStats);
}

export function useAdminStats() {
  return useSWR('admin/stats', getAdminStats);
}
