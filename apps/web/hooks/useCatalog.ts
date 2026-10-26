import useSWR from 'swr';

import { listCatalogProducts, listPublicCategories, type CatalogQuery } from '@/services/catalogService';

export function useCatalogProducts(query: CatalogQuery) {
  const key = [
    'catalog',
    query.region,
    query.categoryId ?? null,
    query.search ?? null,
    query.minPrice ?? null,
    query.maxPrice ?? null,
    query.sort ?? 'newest',
    query.page ?? 0,
  ];
  return useSWR(key, () => listCatalogProducts(query), {
    keepPreviousData: true,
  });
}

export function usePublicCategories() {
  return useSWR('catalog/categories', listPublicCategories);
}
