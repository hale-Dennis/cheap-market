import { useRouter } from 'next/router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { logout } from '@/services/authService';

interface SignOutButtonProps {
  redirectTo?: string;
  className?: string;
}

export function SignOutButton({ redirectTo = '/login', className }: SignOutButtonProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleClick() {
    setSigningOut(true);
    await logout();
    router.replace(redirectTo);
  }

  return (
    <Button variant="outline" size="sm" className={className} onClick={handleClick} disabled={signingOut}>
      {signingOut ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
