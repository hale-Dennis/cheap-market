import * as React from 'react';

import { cn } from '@/lib/utils';

/** Native <select> styled to match Input; keeps keyboard and screen-reader behaviour for free. */
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    className={cn(
      'flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-2 aria-[invalid=true]:border-destructive',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Select.displayName = 'Select';

export { Select };
