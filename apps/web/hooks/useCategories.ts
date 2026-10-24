import useSWR from 'swr';

import { listCategories } from '@/services/categoryService';

export const CATEGORIES_KEY = 'admin/categories';

export function useCategories() {
  return useSWR(CATEGORIES_KEY, listCategories);
}
