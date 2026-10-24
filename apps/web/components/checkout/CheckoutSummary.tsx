import type { Cart, FulfillmentType } from '@cheap-market/shared-types';

import type { CheckoutTotals } from '@/lib/checkout';
import { formatCedis } from '@/lib/format';

interface CheckoutSummaryProps {
  cart: Cart;
  fulfillment: FulfillmentType | null;
  totals: CheckoutTotals;
}

export function CheckoutSummary({ cart, fulfillment, totals }: CheckoutSummaryProps) {
  return (
    <section aria-labelledby="summary-heading" className="space-y-4">
      <h2 id="summary-heading" className="text-lg font-semibold">
        Order summary
      </h2>
      <ul className="space-y-2 text-sm" aria-label="Items">
        {cart.items.map((item) => (
          <li key={item.productId} className="flex justify-between gap-4">
            <span>
              {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
            </span>
            <span className="whitespace-nowrap">{formatCedis(item.lineTotalCents)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t pt-3 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatCedis(cart.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{fulfillment === 'PICKUP' ? 'Pickup' : 'Delivery'}</dt>
          <dd className={totals.deliveryFeeCents === null ? 'text-muted-foreground' : undefined}>
            {totals.deliveryFeeCents === null
              ? 'Choose an option'
              : totals.deliveryFeeCents === 0
                ? 'Free'
                : formatCedis(totals.deliveryFeeCents)}
          </dd>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd aria-live="polite">{formatCedis(totals.totalCents)}</dd>
        </div>
      </dl>
    </section>
  );
}
