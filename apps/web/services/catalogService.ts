import type {
  Category,
  PaginatedResponse,
  ProductCard,
  RegionCode,
} from '@cheap-market/shared-types';

import type { CatalogSort } from '@/lib/catalog';
import { apiRequest } from '@/services/apiClient';

export const CATALOG_PAGE_SIZE = 20;

export interface CatalogQuery {
  region: RegionCode;
  categoryId?: string;
  /** Text to find in the produce or farmer name. */
  search?: string;
  /** Cedis, inclusive, e.g. "15" or "15.50". */
  minPrice?: string;
  maxPrice?: string;
  /** Newest first when not given. */
  sort?: CatalogSort;
  /** Zero-based. */
  page?: number;
}

/** Active listings in a region, newest first unless sorted otherwise. Public: no sign-in needed. */
export function listCatalogProducts({
  region,
  categoryId,
  search,
  minPrice,
  maxPrice,
  sort,
  page = 0,
}: CatalogQuery): Promise<PaginatedResponse<ProductCard>> {
  const params = new URLSearchParams({ region, page: String(page), size: String(CATALOG_PAGE_SIZE) });
  if (categoryId) params.set('categoryId', categoryId);
  if (search) params.set('q', search);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  if (sort && sort !== 'newest') params.set('sort', sort);
  return apiRequest<PaginatedResponse<ProductCard>>(`/products?${params}`);
}

export function listPublicCategories(): Promise<Category[]> {
  return apiRequest<Category[]>('/categories');
}
