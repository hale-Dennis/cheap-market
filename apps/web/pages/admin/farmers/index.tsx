import Link from 'next/link';
import { useEffect, useState } from 'react';
import { regionName, type Farmer } from '@cheap-market/shared-types';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { requireAdminSession, type AdminPageProps } from '@/lib/adminSession';
import { formatGhanaianPhone } from '@/lib/phone';
import { ApiError } from '@/services/apiClient';
import { listFarmers } from '@/services/farmerService';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; farmers: Farmer[]; total: number };

// Pagination controls arrive with Story 1.4; this shows the newest 20 farmers.
export default function FarmersPage({ adminEmail }: AdminPageProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    listFarmers()
      .then((page) => {
        if (!cancelled) {
          setState({ status: 'loaded', farmers: page.content, total: page.totalElements });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              error instanceof ApiError ? error.message : 'Could not load farmers.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout title="Farmers" adminEmail={adminEmail}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Farmers</h1>
        <Link href="/admin/farmers/create" className={buttonVariants()}>
          Create farmer
        </Link>
      </div>

      <Card className="mt-6 overflow-hidden">
        {state.status === 'loading' && (
          <p className="p-6 text-sm text-muted-foreground">Loading farmers…</p>
        )}
        {state.status === 'error' && (
          <p role="alert" className="p-6 text-sm text-destructive">
            {state.message}
          </p>
        )}
        {state.status === 'loaded' && state.farmers.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            No farmers registered yet.
          </p>
        )}
        {state.status === 'loaded' && state.farmers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Registered farmers ({state.total})
              </caption>
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Region</th>
                  <th scope="col" className="px-4 py-3 font-medium">Phone</th>
                  <th scope="col" className="px-4 py-3 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {state.farmers.map((farmer) => (
                  <tr key={farmer.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{farmer.fullName}</td>
                    <td className="px-4 py-3">{regionName(farmer.region)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatGhanaianPhone(farmer.phoneNumber)}
                    </td>
                    <td className="px-4 py-3">
                      {farmer.email ?? (
                        <span className="text-muted-foreground">
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">No email</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminSession;
