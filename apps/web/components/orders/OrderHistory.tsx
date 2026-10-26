import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { OrderFarmer, OrderStatusGroup, OrderSummary } from '@cheap-market/shared-types';

import { StatusBadge } from '@/components/orders/StatusBadge';
import { RateFarmerModal } from '@/components/ratings/RateFarmerModal';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOrderHistory, useOrderStatusCounts } from '@/hooks/useOrderHistory';
import { formatCedis } from '@/lib/format';
import { cn } from '@/lib/utils';
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
    <li className="overflow-hidden rounded-[28px] border bg-card">
      <Link
        href={`/orders/${order.id}`}
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-5 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-7"
      >
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-[17px] font-bold">{order.orderNumber}</p>
          <p className="text-sm text-muted-foreground">
            <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time> · {order.itemCount}{' '}
            {order.itemCount === 1 ? 'item' : 'items'} ·{' '}
            {order.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery'}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <StatusBadge status={order.status} />
          <span className="whitespace-nowrap font-display text-[22px] font-bold">{formatCedis(order.finalTotalCents)}</span>
          <span aria-hidden="true" className="text-xl">›</span>
        </div>
      </Link>
      {order.farmersToRate.length > 0 && (
        // Outside the link: a button can't sit inside one.
        <div className="flex flex-wrap gap-2 px-5 pb-5 sm:px-7">
          {order.farmersToRate.map((farmer) => (
            <Button key={farmer.farmerId} variant="accent" size="sm" onClick={() => onRate(farmer)}>
              <span aria-hidden="true">
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
    <Card className="flex flex-col items-center gap-4 border-dashed px-6 py-14 text-center">
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
      <h2 className="text-[28px] font-extrabold">No orders yet</h2>
      <p className="max-w-sm text-[15px] text-muted-foreground">
        When you place an order, you&apos;ll be able to follow it here.
      </p>
      <Link href="/products" className={buttonVariants()}>
        Browse produce
      </Link>
    </Card>
  );
}

type Tab = 'all' | OrderStatusGroup;

const TABS: { value: Tab; label: string; empty: string }[] = [
  { value: 'all', label: 'All', empty: '' },
  { value: 'active', label: 'Active', empty: 'No orders on their way right now.' },
  { value: 'completed', label: 'Completed', empty: 'No completed orders yet.' },
  { value: 'disputed', label: 'Disputed', empty: 'No orders with a reported issue.' },
];

/** All | Active | Completed | Disputed, each with its count once loaded. */
function OrderTabs({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const { data: counts } = useOrderStatusCounts();
  return (
    <div role="group" aria-label="Filter orders" className="flex flex-wrap gap-1.5 self-start rounded-full border bg-card p-1.5">
      {TABS.map((option) => {
        const selected = option.value === tab;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {option.label}
            {counts && (
              <span
                className={cn(
                  'flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                  selected ? 'bg-accent text-accent-foreground' : 'bg-muted',
                )}
              >
                {counts[option.value]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The buyer's orders, newest first, loading more as they scroll, filtered by tab. */
export function OrderHistory() {
  const [tab, setTab] = useState<Tab>('all');
  const { orders, total, error, isLoading, hasMore, loadingMore, loadMore, refresh } = useOrderHistory(
    tab === 'all' ? undefined : tab,
  );
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
  // A buyer with no orders at all sees the welcome empty state, not empty tabs.
  if (tab === 'all' && !isLoading && orders.length === 0) {
    return <EmptyOrders />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrderTabs tab={tab} onChange={setTab} />
        {!isLoading && (
          <p className="text-[15px] text-muted-foreground">
            {total} {total === 1 ? 'order' : 'orders'}
          </p>
        )}
      </div>
      {isLoading && <Spinner label="Loading your orders…" />}
      {!isLoading && orders.length === 0 && (
        <Card className="border-dashed px-6 py-10 text-center">
          <p className="text-[15px] text-muted-foreground">{TABS.find((option) => option.value === tab)!.empty}</p>
        </Card>
      )}
      <div>
        <ul className="space-y-4" aria-label="Your orders">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onRate={(farmer) => setRating({ orderId: order.id, farmer })} />
          ))}
        </ul>
      </div>
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
