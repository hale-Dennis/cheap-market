import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import type { OrderStatusGroup, OrderSummary, PaginatedResponse } from '@cheap-market/shared-types';

import { countOrders, listOrders } from '@/services/orderService';

type Page = PaginatedResponse<OrderSummary>;

/**
 * The buyer's orders, loaded a page at a time for infinite scrolling.
 * @param status Only one order-history tab; every order when not given.
 */
export function useOrderHistory(status?: OrderStatusGroup) {
  const result = useSWRInfinite<Page>(
    (index, previous: Page | null) => {
      if (previous && previous.currentPage >= previous.totalPages - 1) return null; // no more pages
      return ['orders', status ?? 'all', index];
    },
    ([, , index]: [string, string, number]) => listOrders(index, status),
    // Don't re-fetch every loaded page whenever a new one is requested.
    { revalidateFirstPage: false },
  );

  const pages = result.data ?? [];
  const orders = pages.flatMap((page) => page.content);
  const last = pages[pages.length - 1];
  const hasMore = last !== undefined && last.currentPage < last.totalPages - 1;
  const loadingMore = result.isLoading || (result.size > 0 && result.data !== undefined && pages.length < result.size);

  return {
    orders,
    total: pages[0]?.totalElements ?? 0,
    error: result.error,
    isLoading: result.isLoading,
    hasMore,
    loadingMore,
    loadMore: () => result.setSize(result.size + 1),
    /** Re-fetches every loaded page, e.g. after a rating changes what a row shows. */
    refresh: () => result.mutate(),
  };
}

/** How many orders are in each order-history tab. */
export function useOrderStatusCounts() {
  return useSWR('orders/status-counts', countOrders);
}
