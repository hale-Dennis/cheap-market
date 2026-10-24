import { useRouter } from 'next/router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { logout } from '@/services/authService';

export function SignOutButton({ redirectTo = '/login' }: { redirectTo?: string }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleClick() {
    setSigningOut(true);
    await logout();
    router.replace(redirectTo);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={signingOut}>
      {signingOut ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
