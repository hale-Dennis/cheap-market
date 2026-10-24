import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import type { ApiResponse, BuyerProfile, RegionCode } from '@cheap-market/shared-types';

import { CatalogView, type CatalogFilters } from '@/components/catalog/CatalogView';
import { PublicLayout, type PublicSession } from '@/components/PublicLayout';
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from '@/lib/auth';
import { REGION_COOKIE, parseRegion, saveRegion, serializeRegionCookie } from '@/lib/region';

interface CatalogPageProps {
  initialRegion: RegionCode | null;
  session: PublicSession | null;
}

/** ?category=<id>&page=<n> (1-based) ⇄ filters (0-based page). */
function filtersFromQuery(query: Record<string, string | string[] | undefined>): CatalogFilters {
  const category = typeof query.category === 'string' && query.category ? query.category : undefined;
  const page = Number(query.page);
  return { categoryId: category, page: Number.isInteger(page) && page >= 1 ? page - 1 : 0 };
}

function hrefFor({ categoryId, page }: CatalogFilters): string {
  const params = new URLSearchParams();
  if (categoryId) params.set('category', categoryId);
  if (page > 0) params.set('page', String(page + 1));
  const query = params.toString();
  return query ? `/products?${query}` : '/products';
}

export default function CatalogPage({ initialRegion, session }: CatalogPageProps) {
  const router = useRouter();
  const [region, setRegion] = useState(initialRegion);
  const filters = filtersFromQuery(router.query);

  const handleRegionChange = useCallback(
    (next: RegionCode) => {
      saveRegion(next);
      setRegion(next);
      router.replace(hrefFor({ categoryId: filters.categoryId, page: 0 }), undefined, { shallow: true });
    },
    [router, filters.categoryId],
  );

  const handleFiltersChange = useCallback(
    (next: CatalogFilters) => {
      router.replace(hrefFor(next), undefined, { shallow: true });
    },
    [router],
  );

  return (
    <PublicLayout title="Fresh produce" session={session}>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Fresh produce near you</h1>
      <p className="mb-6 mt-1 text-muted-foreground">Bought straight from the farmers who grew it.</p>
      <CatalogView
        region={region}
        filters={filters}
        onRegionChange={handleRegionChange}
        onFiltersChange={handleFiltersChange}
        hrefForPage={(page) => hrefFor({ ...filters, page })}
      />
    </PublicLayout>
  );
}

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';

/** A signed-in buyer's profile region, so they don't have to pick it again. */
async function buyerProfileRegion(accessToken: string): Promise<RegionCode | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/buyer/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiResponse<BuyerProfile>;
    return parseRegion(body.data?.region);
  } catch {
    return null;
  }
}

/**
 * Region comes from the region cookie; failing that, a signed-in buyer's profile region
 * (remembered in the cookie); otherwise the page asks the visitor to choose.
 */
export const getServerSideProps: GetServerSideProps<CatalogPageProps> = async ({ req, res }) => {
  const token = req.cookies[ACCESS_TOKEN_COOKIE];
  const claims = await verifyAccessToken(token);
  const session = claims ? { email: claims.sub, role: claims.role } : null;

  let region = parseRegion(req.cookies[REGION_COOKIE]);
  if (!region && claims?.role === 'BUYER' && token) {
    region = await buyerProfileRegion(token);
    if (region) res.setHeader('Set-Cookie', serializeRegionCookie(region));
  }

  return { props: { initialRegion: region, session } };
};
