import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { UserRole } from '@cheap-market/shared-types';

import { SignOutButton } from '@/components/SignOutButton';
import { buttonVariants } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
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

/** How many items a signed-in buyer has in their cart; updates when something is added. */
function CartCount() {
  const { data: cart } = useCart(true);
  if (!cart) {
    // Don't show a misleading "0" while the cart is loading.
    return <span className="whitespace-nowrap rounded-full bg-muted px-3 py-1 text-sm">Cart</span>;
  }
  const count = cart.totalItems;
  return (
    <span aria-live="polite" className="whitespace-nowrap rounded-full bg-muted px-3 py-1 text-sm">
      Cart · {count}
      {/* Visually hidden on phones (to fit the header) but always read by screen readers. */}
      <span className="sr-only sm:not-sr-only"> {count === 1 ? 'item' : 'items'}</span>
    </span>
  );
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
                  {session.role === 'BUYER' && <CartCount />}
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
