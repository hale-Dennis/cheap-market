import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { FarmerList } from '@/components/farmers/FarmerList';
import { buttonVariants } from '@/components/ui/button';
import { requireAdminSession, type SessionPageProps } from '@/lib/pageSession';

/** The URL uses 1-based ?page=N; the API is 0-based. Anything invalid means page 1. */
function pageFromQuery(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page >= 1 ? page - 1 : 0;
}

function hrefForPage(page: number) {
  return page === 0 ? '/admin/farmers' : `/admin/farmers?page=${page + 1}`;
}

export default function FarmersPage({ email: adminEmail }: SessionPageProps) {
  const router = useRouter();
  const page = pageFromQuery(router.query.page);

  const handlePageOutOfRange = useCallback(
    (lastPage: number) => {
      router.replace(hrefForPage(lastPage));
    },
    [router],
  );

  return (
    <AdminLayout title="Farmers" adminEmail={adminEmail}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-[40px] font-extrabold leading-none sm:text-[52px]">Farmers</h1>
          <p className="text-base text-muted-foreground">Everyone our agents have registered to sell.</p>
        </div>
        <Link href="/admin/farmers/create" className={buttonVariants()}>
          <span aria-hidden="true" className="text-lg leading-none text-accent">+</span>
          Create farmer
        </Link>
      </div>
      <FarmerList
        page={page}
        hrefForPage={hrefForPage}
        onPageOutOfRange={handlePageOutOfRange}
      />
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminSession;
