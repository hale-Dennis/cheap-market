import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logout } from '@/services/authService';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/farmers', label: 'Farmers' },
];

interface AdminLayoutProps {
  title: string;
  adminEmail: string;
  children: ReactNode;
}

export function AdminLayout({ title, adminEmail, children }: AdminLayoutProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    await logout();
    router.replace('/login');
  }

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
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-semibold text-primary">
                Cheap Market Admin
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </div>
    </>
  );
}
