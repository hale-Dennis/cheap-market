import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  /** Zero-based, as returned by the API. */
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  /** Builds the link for a zero-based page. */
  hrefForPage: (page: number) => string;
  itemLabel?: string;
}

/** Previous/next pagination with a "Showing x–y of z" summary. Renders nothing for a single page. */
export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  hrefForPage,
  itemLabel = 'items',
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const first = currentPage * pageSize + 1;
  const last = Math.min((currentPage + 1) * pageSize, totalElements);
  const hasPrevious = currentPage > 0;
  const hasNext = currentPage < totalPages - 1;
  const linkClass = cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'bg-card');
  const disabledClass = cn(linkClass, 'pointer-events-none opacity-50');

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 px-1 py-3 text-[15px] sm:flex-row"
    >
      <p className="text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{first}–{last}</span> of{' '}
        <span className="font-semibold text-foreground">{totalElements}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-3">
        {hasPrevious ? (
          <Link href={hrefForPage(currentPage - 1)} className={linkClass} rel="prev">
            Previous
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            Previous
          </span>
        )}
        <span aria-current="page" className="rounded-full bg-primary px-4 py-2.5 font-bold text-primary-foreground">
          Page {currentPage + 1} of {totalPages}
        </span>
        {hasNext ? (
          <Link href={hrefForPage(currentPage + 1)} className={linkClass} rel="next">
            Next
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
