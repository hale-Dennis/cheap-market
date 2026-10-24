import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { OrderFarmer, OrderSummary } from '@cheap-market/shared-types';

import { StatusBadge } from '@/components/orders/StatusBadge';
import { RateFarmerModal } from '@/components/ratings/RateFarmerModal';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { formatCedis } from '@/lib/format';
import { ApiError } from '@/services/apiClient';

/** Start loading the next page while the buyer is still this far from the end of the list. */
const PREFETCH_MARGIN = '600px';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Spinner({ label }: { label: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
      />
      {label}
    </p>
  );
}

function OrderRow({ order, onRate }: { order: OrderSummary; onRate: (farmer: OrderFarmer) => void }) {
  return (
    <li>
      <Link
        href={`/orders/${order.id}`}
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6"
      >
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
          <p className="text-sm text-muted-foreground">
            <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time> · {order.itemCount}{' '}
            {order.itemCount === 1 ? 'item' : 'items'} ·{' '}
            {order.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge status={order.status} />
          <span className="whitespace-nowrap font-semibold">{formatCedis(order.finalTotalCents)}</span>
        </div>
      </Link>
      {order.farmersToRate.length > 0 && (
        // Outside the link: a button can't sit inside one.
        <div className="flex flex-wrap gap-2 px-4 pb-4 sm:px-6">
          {order.farmersToRate.map((farmer) => (
            <Button key={farmer.farmerId} variant="outline" size="sm" onClick={() => onRate(farmer)}>
              <span aria-hidden="true" className="mr-1 text-amber-600">
                ★
              </span>
              Rate {farmer.fullName}
            </Button>
          ))}
        </div>
      )}
    </li>
  );
}

function EmptyOrders() {
  return (
    <Card className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <svg aria-hidden="true" viewBox="0 0 64 64" className="h-16 w-16 text-muted-foreground">
        <path
          d="M18 10h28l6 8v36H12V18l6-8zm-6 8h40M24 30h16M24 40h10"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h2 className="text-xl font-semibold">No orders yet</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        When you place an order, you&apos;ll be able to follow it here.
      </p>
      <Link href="/products" className={buttonVariants()}>
        Browse produce
      </Link>
    </Card>
  );
}

/** The buyer's orders, newest first, loading more as they scroll. */
export function OrderHistory() {
  const { orders, total, error, isLoading, hasMore, loadingMore, loadMore, refresh } = useOrderHistory();
  const sentinel = useRef<HTMLDivElement>(null);
  const [rating, setRating] = useState<{ orderId: string; farmer: OrderFarmer } | null>(null);

  // Load the next page when the end of the list comes within PREFETCH_MARGIN of the viewport.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loadingMore) loadMore();
      },
      { rootMargin: PREFETCH_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  if (error && orders.length === 0) {
    return (
      <Card className="p-6">
        <p role="alert" className="text-sm text-destructive">
          {error instanceof ApiError ? error.message : 'Could not load your orders.'}
        </p>
      </Card>
    );
  }
  if (isLoading) {
    return <Spinner label="Loading your orders…" />;
  }
  if (orders.length === 0) {
    return <EmptyOrders />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? 'order' : 'orders'}
      </p>
      <Card className="overflow-hidden">
        <ul className="divide-y" aria-label="Your orders">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onRate={(farmer) => setRating({ orderId: order.id, farmer })} />
          ))}
        </ul>
      </Card>
      <div ref={sentinel} />
      {loadingMore && <Spinner label="Loading more orders…" />}
      {hasMore && !loadingMore && (
        // Also a fallback for keyboard users and browsers without IntersectionObserver.
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore()}>
            Load more orders
          </Button>
        </div>
      )}
      {!hasMore && orders.length > 10 && (
        <p className="text-center text-sm text-muted-foreground">That&apos;s all your orders.</p>
      )}
      <RateFarmerModal
        orderId={rating?.orderId ?? ''}
        farmer={rating?.farmer ?? null}
        onClose={() => setRating(null)}
        onRated={() => refresh()}
      />
    </div>
  );
}
