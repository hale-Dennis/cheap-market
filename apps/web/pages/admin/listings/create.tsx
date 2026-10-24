import Link from 'next/link';
import { toast } from 'sonner';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ListingForm } from '@/components/listings/ListingForm';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { useAllFarmers } from '@/hooks/useAllFarmers';
import { useCategories } from '@/hooks/useCategories';
import { requireAdminSession, type SessionPageProps } from '@/lib/pageSession';
import { ApiError } from '@/services/apiClient';

export default function CreateListingPage({ email: adminEmail }: SessionPageProps) {
  const farmers = useAllFarmers();
  const categories = useCategories();
  const loadError = farmers.error ?? categories.error;
  const ready = farmers.data && categories.data;

  return (
    <AdminLayout title="Create listing" adminEmail={adminEmail}>
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to dashboard
      </Link>
      <Card className="mt-4 max-w-2xl">
        <CardHeader>
          <h1 className="text-2xl font-bold tracking-tight">Create listing</h1>
          <CardDescription>List produce for sale on behalf of a farmer.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadError && !ready && (
            <p role="alert" className="text-sm text-destructive">
              {loadError instanceof ApiError ? loadError.message : 'Could not load farmers and categories.'}
            </p>
          )}
          {!loadError && !ready && <p className="text-sm text-muted-foreground">Loading…</p>}
          {ready && farmers.data!.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No farmers yet.{' '}
              <Link href="/admin/farmers/create" className="font-medium text-primary hover:underline">
                Register a farmer
              </Link>{' '}
              before creating a listing.
            </p>
          )}
          {ready && farmers.data!.length > 0 && categories.data!.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No categories yet.{' '}
              <Link href="/admin/categories" className="font-medium text-primary hover:underline">
                Add a category
              </Link>{' '}
              before creating a listing.
            </p>
          )}
          {ready && farmers.data!.length > 0 && categories.data!.length > 0 && (
            <ListingForm
              farmers={farmers.data!}
              categories={categories.data!}
              onCreated={(listing, farmer) =>
                toast.success(`"${listing.name}" is now listed for ${farmer.fullName}.`)
              }
            />
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminSession;
