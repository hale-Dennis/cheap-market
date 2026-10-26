import Link from 'next/link';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { NotificationsPanel } from '@/components/admin/NotificationsPanel';
import { buttonVariants } from '@/components/ui/button';
import { requireAdminSession, type SessionPageProps } from '@/lib/pageSession';
import { cn } from '@/lib/utils';

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

/** Card colours down the Manage column, the first one the forest-green highlight. */
const TONES = ['dark', 'light', 'muted', 'light'] as const;

export default function AdminDashboard({ email: adminEmail }: SessionPageProps) {
  return (
    <AdminLayout title="Dashboard" adminEmail={adminEmail}>
      <div className="space-y-2">
        <h1 className="text-[40px] font-extrabold leading-none sm:text-[52px]">Admin Dashboard</h1>
        <p className="text-base text-muted-foreground">
          Signed in as <span className="font-bold text-foreground">{adminEmail}</span>
        </p>
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <NotificationsPanel />

        <section aria-labelledby="manage-heading" className="space-y-4">
          <h2 id="manage-heading" className="text-2xl font-bold">
            Manage
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {SECTIONS.map((section, index) => {
              const dark = TONES[index] === 'dark';
              return (
                <li
                  key={section.title}
                  className={cn(
                    'flex h-full flex-col gap-4 rounded-3xl p-6',
                    dark && 'bg-primary text-primary-foreground',
                    TONES[index] === 'light' && 'border bg-card',
                    TONES[index] === 'muted' && 'bg-muted',
                  )}
                >
                  <div className="space-y-1">
                    <h3 className="font-sans text-[19px] font-bold">{section.title}</h3>
                    <p className={cn('text-[15px]', dark ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                      {section.description}
                    </p>
                  </div>
                  {section.actions ? (
                    <div className="mt-auto flex flex-wrap gap-2">
                      {section.actions.map((action) => (
                        <Link
                          key={action.href}
                          href={action.href}
                          className={buttonVariants({
                            variant: action.primary ? (dark ? 'accent' : 'default') : 'outline',
                            size: 'sm',
                            className:
                              !action.primary && dark
                                ? 'border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10'
                                : undefined,
                          })}
                        >
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-auto text-xs font-bold uppercase tracking-widest text-muted-foreground">Coming soon</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminSession;
