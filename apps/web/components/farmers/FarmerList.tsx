import Link from 'next/link';
import { useEffect } from 'react';

import { FarmersTable } from '@/components/farmers/FarmersTable';
import { Pagination } from '@/components/Pagination';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFarmers } from '@/hooks/useFarmers';
import { ApiError } from '@/services/apiClient';

interface FarmerListProps {
  /** Zero-based page to show. */
  page: number;
  /** Builds the link for a zero-based page. */
  hrefForPage: (page: number) => string;
  /** Called with the last valid page when `page` is beyond the end of the list. */
  onPageOutOfRange: (lastPage: number) => void;
}

export function FarmerList({ page, hrefForPage, onPageOutOfRange }: FarmerListProps) {
  const { data, error, isLoading, isValidating } = useFarmers(page);

  const outOfRange = data !== undefined && data.totalPages > 0 && page >= data.totalPages;
  useEffect(() => {
    if (outOfRange) {
      onPageOutOfRange(data.totalPages - 1);
    }
  }, [outOfRange, data, onPageOutOfRange]);

  if (error && !data) {
    return (
      <Card className="p-6">
        <p role="alert" className="text-sm text-destructive">
          {error instanceof ApiError ? error.message : 'Could not load farmers.'}
        </p>
      </Card>
    );
  }

  if (isLoading || !data || outOfRange) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading farmers…</p>
      </Card>
    );
  }

  if (data.totalElements === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold">No farmers yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Register the first farmer so you can start listing their produce.
        </p>
        <Link href="/admin/farmers/create" className={buttonVariants()}>
          Create farmer
        </Link>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" aria-busy={isValidating}>
      <FarmersTable
        farmers={data.content}
        caption={`Registered farmers, page ${data.currentPage + 1} of ${data.totalPages}`}
      />
      <Pagination
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        totalElements={data.totalElements}
        pageSize={data.size}
        hrefForPage={hrefForPage}
        itemLabel="farmers"
      />
    </Card>
  );
}
