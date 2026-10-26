import Head from 'next/head';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';

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
      <div className="min-h-screen">
        <SiteHeader session={{ email, role: 'BUYER' }} />
        <main className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6">{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}
