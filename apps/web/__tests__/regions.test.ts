/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { REGIONS, isRegionCode, regionName } from '@cheap-market/shared-types';

const REGION_ENUM = join(
  __dirname,
  '../../api/src/main/java/com/ftb/api/model/Region.java',
);

describe('regions', () => {
  it('matches the backend Region enum exactly', () => {
    const source = readFileSync(REGION_ENUM, 'utf8');
    const backendRegions = Array.from(source.matchAll(/^\s+([A-Z_]+)\("([^"]+)"\)[,;]/gm)).map(
      ([, code, name]) => ({ code, name }),
    );

    expect(backendRegions).toHaveLength(16);
    expect(REGIONS).toEqual(backendRegions);
  });

  it('recognises region codes and names', () => {
    expect(isRegionCode('GREATER_ACCRA')).toBe(true);
    expect(isRegionCode('Greater Accra')).toBe(false);
    expect(regionName('GREATER_ACCRA')).toBe('Greater Accra');
    expect(regionName('LEGACY')).toBe('LEGACY');
  });
});
