import Link from 'next/link';
import { Fragment } from 'react';

import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Cart', href: '/cart' },
  { label: 'Checkout', href: '/checkout' },
  { label: 'Done', href: null },
];

/** Cart → Checkout → Done progress, with the current step (1-based) highlighted. */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol aria-label="Checkout progress" className="flex flex-wrap items-center gap-2.5 text-sm font-semibold">
      {STEPS.map((step, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        const marker = (
          <span
            aria-hidden="true"
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-[13px]',
              done && 'bg-primary text-accent',
              active && 'border-2 border-primary bg-accent text-accent-foreground',
              !done && !active && 'border-2 border-input text-muted-foreground',
            )}
          >
            {done ? '✓' : number}
          </span>
        );
        return (
          <Fragment key={step.label}>
            {index > 0 && <li aria-hidden="true" className={cn('h-0.5 w-8', done || active ? 'bg-primary' : 'bg-input')} />}
            <li aria-current={active ? 'step' : undefined} className={cn('flex items-center gap-2', !done && !active && 'text-muted-foreground')}>
              {done && step.href ? (
                <Link href={step.href} className="flex min-h-11 items-center gap-2 hover:underline">
                  {marker}
                  {step.label}
                  <span className="sr-only"> (completed)</span>
                </Link>
              ) : (
                <>
                  {marker}
                  {step.label}
                </>
              )}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
