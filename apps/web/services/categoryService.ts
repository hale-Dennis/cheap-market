import type { Category, CategoryRequest } from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

/** All categories, ordered by name. */
export function listCategories(): Promise<Category[]> {
  return apiRequest<Category[]>('/admin/categories');
}

export function createCategory(request: CategoryRequest): Promise<Category> {
  return apiRequest<Category>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function updateCategory(id: string, request: CategoryRequest): Promise<Category> {
  return apiRequest<Category>(`/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function deleteCategory(id: string): Promise<void> {
  return apiRequest<void>(`/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
