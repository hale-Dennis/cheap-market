import type {
  AdminProduct,
  CreateProductRequest,
  ImageUploadResponse,
} from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

/** Uploads listing images into the farmer's folder and returns their URLs, in order. */
export async function uploadListingImages(farmerId: string, files: File[]): Promise<string[]> {
  const body = new FormData();
  files.forEach((file) => body.append('files', file));
  const params = new URLSearchParams({ farmerId });
  const { urls } = await apiRequest<ImageUploadResponse>(`/admin/uploads/images?${params}`, {
    method: 'POST',
    body,
  });
  return urls;
}

export function createProduct(request: CreateProductRequest): Promise<AdminProduct> {
  return apiRequest<AdminProduct>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
