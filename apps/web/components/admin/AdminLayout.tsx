import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

import { Logo } from '@/components/brand/Logo';
import { SignOutButton } from '@/components/SignOutButton';
import { cn } from '@/lib/utils';

const ICON_PATHS: Record<string, string[]> = {
  dashboard: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  farmers: ['M13 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M2 21c0-4 3-7 7-7s7 3 7 7', 'M16 4a4 4 0 0 1 0 8', 'M22 21c0-3-1.5-5.5-4-6.5'],
  categories: ['M3 7h7l2 2h9v10H3z'],
  listing: ['M12 5v14', 'M5 12h14'],
};

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/farmers', label: 'Farmers', icon: 'farmers' },
  { href: '/admin/categories', label: 'Categories', icon: 'categories' },
  { href: '/admin/listings/create', label: 'New listing', icon: 'listing' },
];

interface AdminLayoutProps {
  title: string;
  adminEmail: string;
  children: ReactNode;
}

/** Admin pages: a forest-green sidebar beside the content, stacked above it on phones. */
export function AdminLayout({ title, adminEmail, children }: AdminLayoutProps) {
  const router = useRouter();

  function isActive(href: string) {
    return href === '/admin'
      ? router.pathname === '/admin'
      : router.pathname.startsWith(href);
  }

  return (
    <>
      <Head>
        <title>{`${title} · Cheap Market Admin`}</title>
      </Head>
      <div className="flex min-h-screen flex-col gap-4 p-4 lg:flex-row lg:items-start">
        <aside className="flex flex-col gap-6 rounded-[28px] bg-primary p-5 text-primary-foreground lg:min-h-[calc(100vh-2rem)] lg:w-64 lg:shrink-0">
          <Logo href="/admin" tone="light" caption="Admin" />
          <nav aria-label="Admin">
            <ul className="flex flex-wrap gap-1 lg:flex-col">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-12 items-center gap-3 rounded-2xl px-4 font-semibold',
                        active ? 'bg-accent font-bold text-accent-foreground' : 'hover:bg-primary-foreground/10',
                      )}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {ICON_PATHS[item.icon].map((d) => (
                          <path key={d} d={d} />
                        ))}
                      </svg>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="flex flex-wrap items-center gap-3 border-t border-primary-foreground/15 pt-4 text-sm lg:mt-auto lg:flex-col lg:items-start">
            {/* Not "Signed in as …": the dashboard says that, and the page should say it once. */}
            <p className="text-primary-foreground/75">
              <span className="block">Admin account</span>
              <span className="block break-all font-semibold text-primary-foreground">{adminEmail}</span>
            </p>
            <SignOutButton className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10" />
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-1 py-2 lg:px-6 lg:py-4">{children}</main>
      </div>
    </>
  );
}
