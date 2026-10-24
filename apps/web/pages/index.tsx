import Head from 'next/head';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

const HomePage = () => {
  return (
    <>
      <Head>
        <title>Cheap Market</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Welcome</h1>
        <p className="max-w-md text-muted-foreground">
          Fresh produce straight from Ghanaian farmers, at fair prices.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup" className={buttonVariants()}>
            Create an account
          </Link>
          <Link href="/login" className={buttonVariants({ variant: 'outline' })}>
            Sign in
          </Link>
        </div>
      </main>
    </>
  );
};

export default HomePage;
