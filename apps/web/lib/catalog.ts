/** The catalog's ?sort= options, as the API accepts them. */
export const CATALOG_SORTS = ['newest', 'price_asc', 'price_desc', 'top_rated'] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];
