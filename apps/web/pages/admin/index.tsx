import Link from 'next/link';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { NotificationsPanel } from '@/components/admin/NotificationsPanel';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { requireAdminSession, type SessionPageProps } from '@/lib/pageSession';

interface Section {
  title: string;
  description: string;
  actions?: { href: string; label: string; primary?: boolean }[];
}

const SECTIONS: Section[] = [
  {
    title: 'Farmers',
    description: 'Register farmers and keep their details up to date.',
    actions: [
      { href: '/admin/farmers/create', label: 'Create farmer', primary: true },
      { href: '/admin/farmers', label: 'View farmers' },
    ],
  },
  {
    title: 'Categories',
    description: 'Organise produce into categories buyers can browse.',
    actions: [{ href: '/admin/categories', label: 'Manage categories', primary: true }],
  },
  {
    title: 'Produce listings',
    description: 'List produce on behalf of farmers.',
    actions: [{ href: '/admin/listings/create', label: 'Create new listing', primary: true }],
  },
  {
    title: 'Orders',
    description: 'Track and update buyer orders.',
  },
];

export default function AdminDashboard({ email: adminEmail }: SessionPageProps) {
  return (
    <AdminLayout title="Dashboard" adminEmail={adminEmail}>
      <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Signed in as <span className="font-medium">{adminEmail}</span>
      </p>

      <div className="mt-6">
        <NotificationsPanel />
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <li key={section.title}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {section.actions ? (
                  <div className="flex flex-wrap gap-2">
                    {section.actions.map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        className={buttonVariants({
                          variant: action.primary ? 'default' : 'outline',
                          size: 'sm',
                        })}
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Coming soon
                  </p>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminSession;
