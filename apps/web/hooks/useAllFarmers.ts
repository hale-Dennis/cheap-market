import useSWR from 'swr';
import type { Farmer } from '@cheap-market/shared-types';

import { listFarmers } from '@/services/farmerService';

const PAGE_SIZE = 100; // the API maximum

/** Every farmer, for pickers. Loads pages of 100 until the end. */
async function fetchAllFarmers(): Promise<Farmer[]> {
  const farmers: Farmer[] = [];
  for (let page = 0; ; page++) {
    const result = await listFarmers(page, PAGE_SIZE);
    farmers.push(...result.content);
    if (page >= result.totalPages - 1) {
      return farmers.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
  }
}

export function useAllFarmers() {
  return useSWR('admin/farmers/all', fetchAllFarmers);
}
