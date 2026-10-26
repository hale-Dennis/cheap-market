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
  PENDING: 'bg-status-pending text-status-pending-foreground',
  READY_FOR_PICKUP: 'bg-status-ready text-status-ready-foreground',
  OUT_FOR_DELIVERY: 'bg-status-delivery text-status-delivery-foreground',
  COMPLETED: 'bg-status-completed text-status-completed-foreground',
  DISPUTED: 'bg-status-disputed text-status-disputed-foreground',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-bold',
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
