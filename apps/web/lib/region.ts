import { isRegionCode, type RegionCode } from '@cheap-market/shared-types';

/** The region a visitor shops in. Not HttpOnly: the catalog page reads and updates it in the browser. */
export const REGION_COOKIE = 'cm_region';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function parseRegion(value: unknown): RegionCode | null {
  return typeof value === 'string' && isRegionCode(value) ? value : null;
}

export function serializeRegionCookie(region: RegionCode): string {
  return `${REGION_COOKIE}=${region}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

/** Remembers the visitor's region in the browser. */
export function saveRegion(region: RegionCode) {
  document.cookie = serializeRegionCookie(region);
}
