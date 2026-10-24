import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

import { AuthCard } from '@/components/auth/AuthCard';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { destinationAfterSignIn } from '@/lib/roles';
import type { LoginResult } from '@/services/authService';

export default function SignUpPage() {
  const router = useRouter();
  const next = router.query.next;
  const signInHref =
    typeof next === 'string' ? `/login?next=${encodeURIComponent(next)}` : '/login';

  function handleSuccess({ role }: LoginResult) {
    toast.success('Welcome to Cheap Market! Your account is ready.');
    router.replace(destinationAfterSignIn(role, next));
  }

  return (
    <AuthCard
      title="Create your account"
      description="Buy fresh produce directly from farmers in your region."
      footer={
        <>
          Already have an account?{' '}
          <Link href={signInHref} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm onSuccess={handleSuccess} />
    </AuthCard>
  );
}
