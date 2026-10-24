import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { UserRole } from '@cheap-market/shared-types';

import { CartLink } from '@/components/cart/CartLink';
import { SignOutButton } from '@/components/SignOutButton';
import { buttonVariants } from '@/components/ui/button';
import { homeForRole } from '@/lib/roles';

export interface PublicSession {
  email: string;
  role: UserRole;
}

interface PublicLayoutProps {
  title: string;
  session: PublicSession | null;
  children: ReactNode;
}

/** Layout for pages anyone can visit, such as the catalog. */
export function PublicLayout({ title, session, children }: PublicLayoutProps) {
  return (
    <>
      <Head>
        <title>{`${title} · Cheap Market`}</title>
      </Head>
      <div className="min-h-screen bg-muted">
        <header className="border-b bg-background">
          {/* Wraps onto two rows on narrow phones rather than overflowing sideways. */}
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/" className="whitespace-nowrap font-semibold text-primary">
                Cheap Market
              </Link>
              <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
                Produce
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {session ? (
                <>
                  {session.role === 'BUYER' && <CartLink />}
                  <Link
                    href={homeForRole(session.role)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {session.role === 'ADMIN' ? 'Admin' : 'My account'}
                  </Link>
                  <SignOutButton redirectTo="/products" />
                </>
              ) : (
                <>
                  <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                    Sign in
                  </Link>
                  <Link href="/signup" className={buttonVariants({ size: 'sm' })}>
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </>
  );
}
