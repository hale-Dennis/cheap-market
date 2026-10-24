import useSWR from 'swr';

import { getBuyerProfile } from '@/services/buyerService';

export function useBuyerProfile() {
  return useSWR('buyer/profile', getBuyerProfile);
}
