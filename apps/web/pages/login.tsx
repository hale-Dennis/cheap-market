import Head from 'next/head';
import { useRouter } from 'next/router';

import { LoginForm } from '@/components/LoginForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { safeRedirectPath } from '@/lib/redirect';
import type { LoginResult } from '@/services/authService';

export default function LoginPage() {
  const router = useRouter();

  function handleSuccess({ role }: LoginResult) {
    const destination =
      role === 'ADMIN' ? safeRedirectPath(router.query.next, '/admin') : '/';
    router.replace(destination);
  }

  return (
    <>
      <Head>
        <title>Sign in · Cheap Market</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <p className="text-sm font-semibold text-primary">Cheap Market</p>
            <h1 className="text-xl font-semibold leading-none tracking-tight">
              Admin sign in
            </h1>
            <CardDescription>
              Sign in with your administrator account to manage farmers and
              produce.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
