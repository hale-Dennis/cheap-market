import useSWR from 'swr';

import { listCatalogProducts, listPublicCategories, type CatalogQuery } from '@/services/catalogService';

export function useCatalogProducts(query: CatalogQuery) {
  return useSWR(['catalog', query.region, query.categoryId ?? null, query.page ?? 0], () => listCatalogProducts(query), {
    keepPreviousData: true,
  });
}

export function usePublicCategories() {
  return useSWR('catalog/categories', listPublicCategories);
}
