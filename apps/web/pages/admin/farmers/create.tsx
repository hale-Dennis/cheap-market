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
      <Link href="/admin/farmers" className="inline-flex min-h-11 items-center text-[15px] font-semibold hover:underline">
        ← Back to farmers
      </Link>
      <Card className="mt-3 max-w-2xl border-2 border-primary">
        <CardHeader className="p-7 pb-2">
          <h1 className="text-[34px] font-extrabold leading-tight sm:text-[40px]">Create farmer</h1>
          <CardDescription className="text-base">
            Register a farmer so you can list produce on their behalf.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-7 pt-4">
          <CreateFarmerForm onCreated={handleCreated} />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminSession;
