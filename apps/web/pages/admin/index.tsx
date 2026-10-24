import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from '@/lib/auth';
import { logout } from '@/services/authService';

interface AdminDashboardProps {
  email: string;
}

const SECTIONS = [
  {
    title: 'Farmers',
    description: 'Register farmers and keep their details up to date.',
  },
  {
    title: 'Categories',
    description: 'Organise produce into categories buyers can browse.',
  },
  {
    title: 'Produce listings',
    description: 'List produce on behalf of farmers.',
  },
  {
    title: 'Orders',
    description: 'Track and update buyer orders.',
  },
];

export default function AdminDashboard({ email }: AdminDashboardProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    await logout();
    router.replace('/login');
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard · Cheap Market</title>
      </Head>
      <div className="min-h-screen bg-muted">
        <header className="border-b bg-background">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <span className="font-semibold text-primary">
              Cheap Market Admin
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Signed in as <span className="font-medium">{email}</span>
          </p>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {SECTIONS.map((section) => (
              <li key={section.title}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Coming soon
                    </p>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </>
  );
}

// Middleware already guards /admin; this re-check keeps the page safe if the matcher changes.
export const getServerSideProps: GetServerSideProps<
  AdminDashboardProps
> = async ({ req, resolvedUrl }) => {
  const session = await verifyAccessToken(req.cookies[ACCESS_TOKEN_COOKIE]);
  if (session?.role !== 'ADMIN') {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(resolvedUrl)}`,
        permanent: false,
      },
    };
  }
  return { props: { email: session.sub } };
};
