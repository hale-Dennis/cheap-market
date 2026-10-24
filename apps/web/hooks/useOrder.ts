import useSWR from 'swr';

import { getOrder } from '@/services/orderService';

export function useOrder(orderId: string | null) {
  return useSWR(orderId ? ['order', orderId] : null, () => getOrder(orderId!));
}
