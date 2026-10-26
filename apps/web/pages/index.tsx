import type { GetServerSideProps } from 'next';
import type { RegionCode } from '@cheap-market/shared-types';

import { CtaBand, ForFarmers, FreshThisWeek, Hero, HowItWorks, ShopByCategory } from '@/components/home/HomeSections';
import { PublicLayout, type PublicSession } from '@/components/PublicLayout';
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from '@/lib/auth';
import { REGION_COOKIE, parseRegion } from '@/lib/region';

/** Shown in "Fresh this week" until the visitor picks a region in the catalog. */
export const DEFAULT_HOME_REGION: RegionCode = 'GREATER_ACCRA';

interface HomePageProps {
  region: RegionCode;
  session: PublicSession | null;
}

export default function HomePage({ region, session }: HomePageProps) {
  return (
    <PublicLayout title="Fresh produce from Ghanaian farmers" session={session}>
      <div className="space-y-20 sm:space-y-24">
        <Hero />
        <ShopByCategory />
        <FreshThisWeek region={region} />
        <HowItWorks />
        <ForFarmers />
        <CtaBand />
      </div>
    </PublicLayout>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async ({ req }) => {
  const claims = await verifyAccessToken(req.cookies[ACCESS_TOKEN_COOKIE]);
  const session = claims ? { email: claims.sub, role: claims.role } : null;
  const region = parseRegion(req.cookies[REGION_COOKIE]) ?? DEFAULT_HOME_REGION;
  return { props: { region, session } };
};
