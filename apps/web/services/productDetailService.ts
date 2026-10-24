import type { ApiResponse, ProductDetail } from '@cheap-market/shared-types';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';

/**
 * Server-side fetch of a public product. Returns null when it doesn't exist or isn't for sale
 * (the API answers 404, or 400 for a malformed id).
 */
export async function fetchProductDetail(productId: string): Promise<ProductDetail | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/products/${encodeURIComponent(productId)}`);
  if (response.status === 404 || response.status === 400) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Loading product ${productId} failed with ${response.status}`);
  }
  const body = (await response.json()) as ApiResponse<ProductDetail>;
  return body.data ?? null;
}
