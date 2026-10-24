import Link from 'next/link';
import { toast } from 'sonner';

import { BuyerLayout } from '@/components/buyer/BuyerLayout';
import { BuyerProfileForm } from '@/components/buyer/BuyerProfileForm';
import { Card, CardContent } from '@/components/ui/card';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { requireBuyerSession, type SessionPageProps } from '@/lib/pageSession';
import { parseRegion, saveRegion } from '@/lib/region';
import { ApiError } from '@/services/apiClient';

export default function BuyerProfilePage({ email }: SessionPageProps) {
  const { data: profile, error, mutate } = useBuyerProfile();

  return (
    <BuyerLayout title="Your profile" email={email}>
      <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
      <p className="mt-1 text-muted-foreground">
        Manage your details and where we deliver your orders.{' '}
        <Link href="/orders" className="font-medium text-primary hover:underline">
          View my orders
        </Link>
      </p>

      <Card className="mt-6">
        <CardContent className="pt-6">
          {error && !profile && (
            <p role="alert" className="text-sm text-destructive">
              {error instanceof ApiError ? error.message : 'Could not load your profile.'}
            </p>
          )}
          {!error && !profile && (
            <p className="text-sm text-muted-foreground">Loading your profile…</p>
          )}
          {profile && (
            <BuyerProfileForm
              profile={profile}
              onSaved={(saved) => {
                mutate(saved, { revalidate: false });
                // Keep the catalog showing produce from the buyer's (possibly new) region.
                const region = parseRegion(saved.region);
                if (region) saveRegion(region);
                toast.success('Your profile has been saved.');
              }}
            />
          )}
        </CardContent>
      </Card>
    </BuyerLayout>
  );
}

export const getServerSideProps = requireBuyerSession;
