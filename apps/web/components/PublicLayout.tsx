import Head from 'next/head';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader, type SiteSession } from '@/components/layout/SiteHeader';

export type PublicSession = SiteSession;

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
      <div className="min-h-screen">
        <SiteHeader session={session} signOutTo="/products" />
        <main className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6">{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}
