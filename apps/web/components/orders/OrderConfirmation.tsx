import Link from 'next/link';
import { useState } from 'react';
import type { Address, Dispute, DisputeStatus, OrderDetail, OrderFarmer } from '@cheap-market/shared-types';

import { DisputeFormModal } from '@/components/disputes/DisputeFormModal';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { StatusTrack } from '@/components/orders/StatusTrack';
import { RateFarmerModal } from '@/components/ratings/RateFarmerModal';
import { Stars } from '@/components/ratings/Stars';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOrder } from '@/hooks/useOrder';
import { formatCedis } from '@/lib/format';
import { ApiError } from '@/services/apiClient';

function formatAddress(address: Address) {
  return [address.street, address.town, address.gpsAddress].filter(Boolean).join(', ');
}

function formatPlacedAt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
}

function Fulfillment({ order }: { order: OrderDetail }) {
  if (order.fulfillmentType === 'PICKUP' && order.pickupLocation) {
    return (
      <>
        <p className="font-medium">Collect from {order.pickupLocation.name}</p>
        <p className="text-sm text-muted-foreground">{formatAddress(order.pickupLocation.address)}</p>
        {order.pickupLocation.operatingHours && (
          <p className="text-sm text-muted-foreground">Open {order.pickupLocation.operatingHours}</p>
        )}
        <p className="mt-2 text-sm">We&apos;ll let you know when it&apos;s ready to collect.</p>
      </>
    );
  }
  return (
    <>
      <p className="font-medium">Home delivery</p>
      {order.deliveryAddress && (
        <p className="text-sm text-muted-foreground">{formatAddress(order.deliveryAddress)}</p>
      )}
      <p className="mt-2 text-sm">We&apos;ll let you know when it&apos;s on its way.</p>
    </>
  );
}

/** Each farmer in a completed order, with the buyer's rating or a button to give one. */
function FarmerRatings({ order, onRated }: { order: OrderDetail; onRated: () => void }) {
  const [rating, setRating] = useState<OrderFarmer | null>(null);

  return (
    <section aria-labelledby="farmers-heading" className="border-t pt-6">
      <h2 id="farmers-heading" className="mb-1 text-2xl font-bold">
        Rate your {order.farmers.length === 1 ? 'farmer' : 'farmers'}
      </h2>
      <p className="mb-4 text-[15px] text-muted-foreground">Your rating helps other buyers and the farmers themselves.</p>
      <ul className="space-y-3">
        {order.farmers.map((farmer) => (
          <li key={farmer.farmerId} className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-background p-4 text-[15px]">
            <span className="text-[17px] font-bold">{farmer.fullName}</span>
            {farmer.rating ? (
              <span className="flex flex-col items-end">
                <span className="flex items-center gap-2">
                  <Stars rating={farmer.rating.score} className="text-base" />
                  <span>You rated {farmer.rating.score} out of 5</span>
                </span>
                {farmer.rating.comment && (
                  <span className="mt-1 max-w-xs text-right text-muted-foreground">“{farmer.rating.comment}”</span>
                )}
              </span>
            ) : (
              <Button variant="accent" size="sm" onClick={() => setRating(farmer)}>
                <span aria-hidden="true">
                  ★
                </span>
                Rate {farmer.fullName}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <RateFarmerModal orderId={order.id} farmer={rating} onClose={() => setRating(null)} onRated={onRated} />
    </section>
  );
}

const DISPUTE_STATUS_TEXT: Record<DisputeStatus, string> = {
  OPEN: "We've received your report and will review it soon.",
  UNDER_REVIEW: 'Our team is looking into it.',
  RESOLVED: 'This issue has been resolved.',
};

/** The issue the buyer reported on this order. */
function ReportedIssue({ dispute }: { dispute: Dispute }) {
  return (
    <section aria-labelledby="issue-heading" className="rounded-[28px] bg-status-disputed p-6 text-status-disputed-foreground">
      <h2 id="issue-heading" className="mb-1 font-sans text-lg font-bold">
        Issue reported
      </h2>
      <p className="text-sm">
        {formatPlacedAt(dispute.createdAt)} · {DISPUTE_STATUS_TEXT[dispute.status]}
      </p>
      <p className="mt-3 whitespace-pre-line break-words rounded-2xl bg-card/80 p-4 text-[15px] text-foreground">{dispute.reason}</p>
    </section>
  );
}

/** "Report issue" for a completed order that hasn't been reported yet. */
function ReportIssue({ order, onReported }: { order: OrderDetail; onReported: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="report-heading" className="rounded-[28px] bg-muted p-6">
      <h2 id="report-heading" className="mb-1 font-sans text-lg font-bold">
        Problem with this order?
      </h2>
      <p className="mb-4 text-[15px] text-muted-foreground">
        If something was missing, wrong or not good enough, let us know and we&apos;ll sort it out.
      </p>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Report issue
      </Button>
      <DisputeFormModal
        orderId={order.id}
        orderNumber={order.orderNumber}
        open={open}
        onOpenChange={setOpen}
        onReported={onReported}
      />
    </section>
  );
}

interface OrderConfirmationProps {
  orderId: string | null;
  /** "confirmation" right after checkout (thank-you message); "detail" when opened from My orders. */
  variant?: 'confirmation' | 'detail';
}

export function OrderConfirmation({ orderId, variant = 'confirmation' }: OrderConfirmationProps) {
  const { data: order, error, mutate } = useOrder(orderId);

  if (!orderId || (error instanceof ApiError && (error.status === 404 || error.status === 400))) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <h1 className="text-[28px] font-extrabold">We couldn&apos;t find that order</h1>
        <Link href="/products" className={buttonVariants()}>
          Browse produce
        </Link>
      </Card>
    );
  }
  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error instanceof ApiError ? error.message : 'Could not load your order.'}
      </p>
    );
  }
  if (!order) {
    return <p className="text-sm text-muted-foreground">Loading your order…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {variant === 'confirmation' ? (
        <div className="space-y-6">
          <CheckoutSteps current={3} />
          <div className="flex flex-wrap items-center gap-6 rounded-[36px] bg-primary p-7 text-primary-foreground sm:p-12">
            <span aria-hidden="true" className="flex h-[72px] w-[72px] items-center justify-center rounded-3xl bg-accent text-4xl font-bold text-accent-foreground">
              ✓
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <h1 className="text-[40px] font-extrabold leading-none sm:text-6xl">Thank you! Your order is placed.</h1>
              <p className="text-[17px] text-primary-foreground/80">
                Order number <span className="font-mono font-bold text-primary-foreground">{order.orderNumber}</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Link href="/orders" className="inline-flex min-h-11 items-center text-[15px] font-semibold hover:underline">
            ← My orders
          </Link>
          <h1 className="text-[40px] font-extrabold leading-none sm:text-6xl">
            Order <span className="font-mono">{order.orderNumber}</span>
          </h1>
        </div>
      )}

      <StatusTrack status={order.status} fulfillment={order.fulfillmentType} />

      <Card className="space-y-7 p-7">
        {/* Status is shown by the StatusTrack above. */}
        <dl className="grid gap-5 text-[15px] sm:grid-cols-2">
          <div>
            <dt className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Placed</dt>
            <dd className="mt-1 font-semibold">{formatPlacedAt(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Payment</dt>
            <dd className="mt-1 font-semibold">
              {order.paymentStatus === 'PAID' ? 'Paid' : `Pay when you ${order.fulfillmentType === 'PICKUP' ? 'collect' : 'receive'} it`}
            </dd>
          </div>
        </dl>

        <section aria-labelledby="fulfillment-heading" className="border-t pt-6">
          <h2 id="fulfillment-heading" className="mb-2 text-2xl font-bold">
            {order.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery'}
          </h2>
          <Fulfillment order={order} />
        </section>

        <section aria-labelledby="items-heading" className="border-t pt-6">
          <h2 id="items-heading" className="mb-3 text-2xl font-bold">
            Items
          </h2>
          <ul className="space-y-2.5 text-[15px]">
            {order.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-4">
                <span>
                  {item.name}{' '}
                  <span className="text-muted-foreground">
                    × {item.quantity} ({formatCedis(item.priceAtPurchaseCents)} {item.unit})
                  </span>
                </span>
                <span className="whitespace-nowrap font-semibold">{formatCedis(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2.5 border-t pt-4 text-[15px]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatCedis(order.itemsSubtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{order.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery'}</dt>
              <dd>{order.deliveryFeeCents === 0 ? 'Free' : formatCedis(order.deliveryFeeCents)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t pt-3">
              <dt className="font-bold">Total</dt>
              <dd className="font-display text-3xl font-extrabold tracking-tight">{formatCedis(order.finalTotalCents)}</dd>
            </div>
          </dl>
        </section>

        {/* A disputed order was still delivered, so its farmers can still be rated. */}
        {(order.status === 'COMPLETED' || order.status === 'DISPUTED') && order.farmers.length > 0 && (
          <FarmerRatings order={order} onRated={() => mutate()} />
        )}
        {order.dispute ? (
          <ReportedIssue dispute={order.dispute} />
        ) : (
          order.status === 'COMPLETED' && <ReportIssue order={order} onReported={() => mutate()} />
        )}
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        {variant === 'confirmation' && (
          <Link href="/orders" className={buttonVariants({ size: 'lg' })}>
            View my orders
          </Link>
        )}
        <Link href="/products" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
