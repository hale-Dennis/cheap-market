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
      <div className="flex flex-wrap items-start gap-7">
        <aside className="flex w-full flex-col gap-4 lg:w-72">
          <div className="flex flex-col gap-4 rounded-[28px] bg-primary p-6 text-primary-foreground">
            <span aria-hidden="true" className="flex h-[72px] w-[72px] items-center justify-center rounded-3xl bg-accent font-display text-3xl font-extrabold text-accent-foreground">
              {email.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="font-display text-2xl font-bold">Your account</p>
              <p className="text-sm text-primary-foreground/80">Buyer</p>
            </div>
          </div>
          <nav aria-label="Account" className="flex flex-col gap-1 rounded-3xl border bg-card p-2">
            <Link href="/buyer/profile" aria-current="page" className="flex min-h-12 items-center rounded-2xl bg-muted px-4 font-bold">
              Profile
            </Link>
            <Link href="/orders" className="flex min-h-12 items-center rounded-2xl px-4 font-semibold hover:bg-muted">
              View my orders
            </Link>
          </nav>
        </aside>

        <div className="min-w-0 flex-[999_1_480px] space-y-6">
          <div className="space-y-2">
            <h1 className="text-[40px] font-extrabold leading-none sm:text-6xl">Your profile</h1>
            <p className="text-[17px] text-muted-foreground">Manage your details and where we deliver your orders.</p>
          </div>

          <Card>
            <CardContent className="p-7">
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
        </div>
      </div>
    </BuyerLayout>
  );
}

export const getServerSideProps = requireBuyerSession;
