import Head from 'next/head';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Page not found · Cheap Market</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted px-4 text-center">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="text-2xl font-bold tracking-tight">We couldn&apos;t find that page</h1>
        <p className="max-w-md text-muted-foreground">
          The produce you&apos;re looking for may have sold out or been removed by the farmer.
        </p>
        <Link href="/products" className={buttonVariants()}>
          Browse produce
        </Link>
      </main>
    </>
  );
}
