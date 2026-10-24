import type { OrderStatus } from '@cheap-market/shared-types';

import { cn } from '@/lib/utils';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
};

// Dark text on a light tint keeps every badge above WCAG AA contrast (4.5:1).
const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-900 ring-amber-300',
  READY_FOR_PICKUP: 'bg-blue-100 text-blue-900 ring-blue-300',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-900 ring-orange-300',
  COMPLETED: 'bg-green-100 text-green-900 ring-green-300',
  DISPUTED: 'bg-red-100 text-red-900 ring-red-300',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
