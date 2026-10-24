import Link from 'next/link';
import { useRouter } from 'next/router';

import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/LoginForm';
import { destinationAfterSignIn } from '@/lib/roles';
import type { LoginResult } from '@/services/authService';

/** Sign-in for both administrators and buyers; each lands in their own area. */
export default function LoginPage() {
  const router = useRouter();
  const next = router.query.next;
  const signUpHref =
    typeof next === 'string' ? `/signup?next=${encodeURIComponent(next)}` : '/signup';

  function handleSuccess({ role }: LoginResult) {
    router.replace(destinationAfterSignIn(role, next));
  }

  return (
    <AuthCard
      title="Sign in"
      description="Sign in to your Cheap Market account."
      footer={
        <>
          New to Cheap Market?{' '}
          <Link href={signUpHref} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={handleSuccess} />
    </AuthCard>
  );
}
