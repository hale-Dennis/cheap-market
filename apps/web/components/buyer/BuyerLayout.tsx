import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';

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
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="whitespace-nowrap font-semibold text-primary">
              Cheap Market
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
              <SignOutButton redirectTo="/" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </div>
    </>
  );
}
