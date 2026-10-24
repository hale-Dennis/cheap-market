import type {
  Category,
  PaginatedResponse,
  ProductCard,
  RegionCode,
} from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

export const CATALOG_PAGE_SIZE = 20;

export interface CatalogQuery {
  region: RegionCode;
  categoryId?: string;
  /** Zero-based. */
  page?: number;
}

/** Active listings in a region, newest first. Public: no sign-in needed. */
export function listCatalogProducts({ region, categoryId, page = 0 }: CatalogQuery): Promise<PaginatedResponse<ProductCard>> {
  const params = new URLSearchParams({ region, page: String(page), size: String(CATALOG_PAGE_SIZE) });
  if (categoryId) params.set('categoryId', categoryId);
  return apiRequest<PaginatedResponse<ProductCard>>(`/products?${params}`);
}

export function listPublicCategories(): Promise<Category[]> {
  return apiRequest<Category[]>('/categories');
}
