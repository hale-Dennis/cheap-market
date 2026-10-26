import Link from 'next/link';
import { useRouter } from 'next/router';
import type { UserRole } from '@cheap-market/shared-types';

import { Logo } from '@/components/brand/Logo';
import { CartLink } from '@/components/cart/CartLink';
import { SignOutButton } from '@/components/SignOutButton';
import { buttonVariants } from '@/components/ui/button';
import { homeForRole } from '@/lib/roles';
import { cn } from '@/lib/utils';

export interface SiteSession {
  email: string;
  role: UserRole;
}

interface SiteHeaderProps {
  session: SiteSession | null;
  /** Where to go after signing out. */
  signOutTo?: string;
}

/** The shop header: logo, main navigation, cart and account controls. Wraps onto two rows on phones. */
export function SiteHeader({ session, signOutTo = '/' }: SiteHeaderProps) {
  const { pathname } = useRouter();
  const isBuyer = session?.role === 'BUYER';

  const navItems = [
    { href: '/products', label: 'Shop produce' },
    { href: '/#farmers', label: 'Our farmers' },
    ...(isBuyer ? [{ href: '/orders', label: 'My orders' }] : []),
  ];

  return (
    <header className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-7 gap-y-4 px-4 py-5 sm:px-6">
      <Logo />
      <nav aria-label="Main" className="flex flex-wrap gap-x-6 gap-y-1 text-[15px] font-medium">
        {navItems.map((item) => {
          const active = !item.href.includes('#') && pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center border-b-2 border-transparent text-primary hover:text-primary/80',
                active && 'border-primary font-bold',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        {/* A plain GET form: works before hydration and lands on /products?q=…. */}
        <form role="search" action="/products" method="get" className="hidden lg:block">
          <label htmlFor="site-search" className="sr-only">
            Search the shop
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            maxLength={100}
            placeholder="Search tomatoes, yam, plantain…"
            className="h-12 w-72 rounded-full border bg-card px-5 text-[15px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
        {session ? (
          <>
            {isBuyer && <CartLink />}
            <Link
              href={homeForRole(session.role)}
              aria-label={session.role === 'ADMIN' ? 'Admin' : 'My account'}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-primary hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden="true">{session.email.charAt(0).toUpperCase()}</span>
            </Link>
            <SignOutButton redirectTo={signOutTo} />
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
    </header>
  );
}
