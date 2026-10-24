import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

import { SignOutButton } from '@/components/SignOutButton';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/farmers', label: 'Farmers' },
  { href: '/admin/categories', label: 'Categories' },
];

interface AdminLayoutProps {
  title: string;
  adminEmail: string;
  children: ReactNode;
}

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
      <div className="min-h-screen bg-muted">
        <header className="border-b bg-background">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/admin" className="whitespace-nowrap font-semibold text-primary">
                Cheap Market<span className="hidden sm:inline"> Admin</span>
              </Link>
              <nav aria-label="Admin" className="flex gap-4 text-sm">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'text-muted-foreground hover:text-foreground',
                      isActive(item.href) && 'font-medium text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground md:inline">
                {adminEmail}
              </span>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </div>
    </>
  );
}
