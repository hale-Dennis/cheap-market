import useSWR from 'swr';

import { listFarmers } from '@/services/farmerService';

/**
 * Loads one page of farmers. Keeps showing the previous page while the next one loads,
 * and caches visited pages so going back is instant.
 * @param page Zero-based page number.
 */
export function useFarmers(page: number) {
  return useSWR(['admin/farmers', page], () => listFarmers(page), {
    keepPreviousData: true,
  });
}
