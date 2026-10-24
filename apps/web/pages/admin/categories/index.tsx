import { AdminLayout } from '@/components/admin/AdminLayout';
import { CategoryManager } from '@/components/categories/CategoryManager';
import { requireAdminSession, type SessionPageProps } from '@/lib/pageSession';

export default function CategoriesPage({ email: adminEmail }: SessionPageProps) {
  return (
    <AdminLayout title="Categories" adminEmail={adminEmail}>
      <CategoryManager />
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminSession;
