import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { CartLink } from '@/components/cart/CartLink';
import { SignOutButton } from '@/components/SignOutButton';

interface BuyerLayoutProps {
  title: string;
  email: string;
  children: ReactNode;
}

export function BuyerLayout({ title, email, children }: BuyerLayoutProps) {
  return (
    <>
      <Head>
        <title>{`${title} · Cheap Market`}</title>
      </Head>
      <div className="min-h-screen bg-muted">
        <header className="border-b bg-background">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
            <div className="flex items-center gap-4">
              <Link href="/" className="whitespace-nowrap font-semibold text-primary">
                Cheap Market
              </Link>
              <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
                Produce
              </Link>
              <Link href="/orders" className="whitespace-nowrap text-sm text-muted-foreground hover:text-foreground">
                My orders
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <CartLink />
              <span className="hidden text-sm text-muted-foreground md:inline">{email}</span>
              <SignOutButton redirectTo="/" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </div>
    </>
  );
}
