import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type { Farmer } from '@cheap-market/shared-types';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { CreateFarmerForm } from '@/components/farmers/CreateFarmerForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { requireAdminSession, type SessionPageProps } from '@/lib/pageSession';

export default function CreateFarmerPage({ email: adminEmail }: SessionPageProps) {
  const router = useRouter();

  function handleCreated(farmer: Farmer) {
    toast.success(`${farmer.fullName} has been registered as a farmer.`);
    router.push('/admin/farmers');
  }

  return (
    <AdminLayout title="Create farmer" adminEmail={adminEmail}>
      <Link
        href="/admin/farmers"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to farmers
      </Link>
      <Card className="mt-4 max-w-xl">
        <CardHeader>
          <h1 className="text-2xl font-bold tracking-tight">Create farmer</h1>
          <CardDescription>
            Register a farmer so you can list produce on their behalf.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateFarmerForm onCreated={handleCreated} />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminSession;
