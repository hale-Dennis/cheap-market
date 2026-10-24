/**
 * Ghana's administrative regions. `code` is what the API stores and validates.
 * Keep in sync with apps/api/.../model/Region.java (apps/web/__tests__/regions.test.ts enforces this).
 */
export const REGIONS = [
  { code: 'AHAFO', name: 'Ahafo' },
  { code: 'ASHANTI', name: 'Ashanti' },
  { code: 'BONO', name: 'Bono' },
  { code: 'BONO_EAST', name: 'Bono East' },
  { code: 'CENTRAL', name: 'Central' },
  { code: 'EASTERN', name: 'Eastern' },
  { code: 'GREATER_ACCRA', name: 'Greater Accra' },
  { code: 'NORTH_EAST', name: 'North East' },
  { code: 'NORTHERN', name: 'Northern' },
  { code: 'OTI', name: 'Oti' },
  { code: 'SAVANNAH', name: 'Savannah' },
  { code: 'UPPER_EAST', name: 'Upper East' },
  { code: 'UPPER_WEST', name: 'Upper West' },
  { code: 'VOLTA', name: 'Volta' },
  { code: 'WESTERN', name: 'Western' },
  { code: 'WESTERN_NORTH', name: 'Western North' },
] as const;

export type RegionCode = (typeof REGIONS)[number]['code'];

export function isRegionCode(value: string): value is RegionCode {
  return REGIONS.some((region) => region.code === value);
}

/** Human-readable region name, falling back to the raw value for unknown codes. */
export function regionName(code: string): string {
  return REGIONS.find((region) => region.code === code)?.name ?? code;
}
