import type { FulfillmentType, OrderStatus } from '@cheap-market/shared-types';

import { STATUS_LABELS } from '@/components/orders/StatusBadge';
import { cn } from '@/lib/utils';

/** The order's path through its statuses: the middle step depends on pickup vs delivery. */
function stepsFor(fulfillment: FulfillmentType, status: OrderStatus): OrderStatus[] {
  const middle: OrderStatus = fulfillment === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY';
  return ['PENDING', middle, status === 'DISPUTED' ? 'DISPUTED' : 'COMPLETED'];
}

/** A three-step progress track for an order, e.g. Pending → Out for delivery → Completed. */
export function StatusTrack({ status, fulfillment }: { status: OrderStatus; fulfillment: FulfillmentType }) {
  const steps = stepsFor(fulfillment, status);
  const reached = steps.indexOf(status);

  return (
    <ol aria-label="Order progress" className="grid grid-cols-1 gap-4 rounded-[28px] border bg-card p-6 sm:grid-cols-3">
      {steps.map((step, index) => {
        const done = index <= reached;
        const disputed = step === 'DISPUTED';
        return (
          <li key={step} aria-current={index === reached ? 'step' : undefined} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold',
                disputed
                  ? 'bg-status-disputed text-status-disputed-foreground'
                  : done
                    ? 'bg-primary text-accent'
                    : 'border-2 border-input text-muted-foreground',
              )}
            >
              {disputed ? '!' : done ? '✓' : index + 1}
            </span>
            <span className={cn('font-bold', !done && 'text-muted-foreground')}>
              {STATUS_LABELS[step]}
              <span className="sr-only">{done ? ' (reached)' : ' (not yet)'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
