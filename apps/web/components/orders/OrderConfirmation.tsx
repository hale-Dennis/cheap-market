import Link from 'next/link';
import type { Address, OrderDetail } from '@cheap-market/shared-types';

import { StatusBadge } from '@/components/orders/StatusBadge';
import { buttonVariants } from '@/components/ui/button';
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

interface OrderConfirmationProps {
  orderId: string | null;
  /** "confirmation" right after checkout (thank-you message); "detail" when opened from My orders. */
  variant?: 'confirmation' | 'detail';
}

export function OrderConfirmation({ orderId, variant = 'confirmation' }: OrderConfirmationProps) {
  const { data: order, error } = useOrder(orderId);

  if (!orderId || (error instanceof ApiError && (error.status === 404 || error.status === 400))) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold">We couldn&apos;t find that order</h1>
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
    <div className="mx-auto max-w-2xl space-y-6">
      {variant === 'confirmation' ? (
        <div className="text-center">
          <p aria-hidden="true" className="text-4xl">✓</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Thank you! Your order is placed.</h1>
          <p className="mt-2 text-muted-foreground">
            Order number <span className="font-mono font-semibold text-foreground">{order.orderNumber}</span>
          </p>
        </div>
      ) : (
        <div>
          <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
            ← My orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Order <span className="font-mono">{order.orderNumber}</span>
          </h1>
        </div>
      )}

      <Card className="space-y-6 p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Placed</dt>
            <dd className="font-medium">{formatPlacedAt(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <StatusBadge status={order.status} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Payment</dt>
            <dd className="font-medium">
              {order.paymentStatus === 'PAID' ? 'Paid' : `Pay when you ${order.fulfillmentType === 'PICKUP' ? 'collect' : 'receive'} it`}
            </dd>
          </div>
        </dl>

        <section aria-labelledby="fulfillment-heading" className="border-t pt-4">
          <h2 id="fulfillment-heading" className="mb-2 text-lg font-semibold">
            {order.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery'}
          </h2>
          <Fulfillment order={order} />
        </section>

        <section aria-labelledby="items-heading" className="border-t pt-4">
          <h2 id="items-heading" className="mb-2 text-lg font-semibold">
            Items
          </h2>
          <ul className="space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-4">
                <span>
                  {item.name}{' '}
                  <span className="text-muted-foreground">
                    × {item.quantity} ({formatCedis(item.priceAtPurchaseCents)} {item.unit})
                  </span>
                </span>
                <span className="whitespace-nowrap">{formatCedis(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatCedis(order.itemsSubtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{order.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery'}</dt>
              <dd>{order.deliveryFeeCents === 0 ? 'Free' : formatCedis(order.deliveryFeeCents)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatCedis(order.finalTotalCents)}</dd>
            </div>
          </dl>
        </section>
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        {variant === 'confirmation' && (
          <Link href="/orders" className={buttonVariants({ variant: 'outline' })}>
            View my orders
          </Link>
        )}
        <Link href="/products" className={buttonVariants({ variant: 'outline' })}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
