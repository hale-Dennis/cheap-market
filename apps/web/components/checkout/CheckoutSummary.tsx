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
      <h2 id="summary-heading" className="text-[26px] font-bold">
        Order summary
      </h2>
      <ul className="space-y-2.5 text-[15px]" aria-label="Items">
        {cart.items.map((item) => (
          <li key={item.productId} className="flex justify-between gap-4">
            <span>
              {item.name} <span className="text-primary-foreground/75">× {item.quantity}</span>
            </span>
            <span className="whitespace-nowrap">{formatCedis(item.lineTotalCents)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-3 border-t border-primary-foreground/20 pt-4 text-[15px]">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatCedis(cart.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{fulfillment === 'PICKUP' ? 'Pickup' : 'Delivery'}</dt>
          <dd className={totals.deliveryFeeCents === null ? 'text-primary-foreground/75' : 'font-semibold'}>
            {totals.deliveryFeeCents === null
              ? 'Choose an option'
              : totals.deliveryFeeCents === 0
                ? 'Free'
                : formatCedis(totals.deliveryFeeCents)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-primary-foreground/20 pt-4">
          <dt className="text-base font-semibold">Total</dt>
          <dd aria-live="polite" className="font-display text-4xl font-extrabold tracking-tight text-accent">
            {formatCedis(totals.totalCents)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
