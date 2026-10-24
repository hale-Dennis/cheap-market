import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Centred card used by the sign-in and sign-up pages. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <>
      <Head>
        <title>{`${title} · Cheap Market`}</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <Link href="/" className="text-sm font-semibold text-primary">
              Cheap Market
            </Link>
            <h1 className="text-xl font-semibold leading-none tracking-tight">{title}</h1>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
            <p className="text-center text-sm text-muted-foreground">{footer}</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
