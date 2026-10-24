/** Units a listing can be sold in; the API stores the label as given. */
export const PRODUCE_UNITS = [
  'per kg',
  'per bunch',
  'per piece',
  'per dozen',
  'per crate',
  'per bag',
  'per basket',
  'per tuber',
  'per bowl',
] as const;

export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT';

/** Request body for POST /admin/products (see CreateProductRequest.java). */
export interface CreateProductRequest {
  farmerId: string;
  categoryId: string;
  name: string;
  description?: string;
  /** Price in pesewas: GH₵ 15.00 is 1500. */
  priceCents: number;
  unit: string;
  /** ISO date (YYYY-MM-DD), today or earlier. */
  harvestDate: string;
  /** 1–5 URLs returned by POST /admin/uploads/images. */
  imageUrls: string[];
}

/** A listing as returned by the admin product endpoints (see ProductResponse.java). */
export interface AdminProduct {
  id: string;
  farmerId: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  unit: string;
  harvestDate: string;
  stockQuantity: number;
  imageUrls: string[];
  listingStatus: ListingStatus;
  createdAt: string;
}

/** Response of POST /admin/uploads/images. */
export interface ImageUploadResponse {
  urls: string[];
}

/** A listing card in the public catalog (see ProductCardResponse.java). */
export interface ProductCard {
  id: string;
  name: string;
  priceCents: number;
  unit: string;
  /** First photo, or null if the listing has none. */
  primaryImageUrl: string | null;
  /** ISO date (YYYY-MM-DD). */
  harvestDate: string;
  farmerName: string;
  categoryName: string;
}

/** The farmer behind a listing, as shown on the product page (see FarmerInfo.java). */
export interface FarmerSummary {
  fullName: string;
  region: string;
  /** Null or 0 until the farmer has been rated. */
  averageRating: number | null;
  ratingCount: number | null;
}

/** Response of GET /products/{id} (see ProductDetailResponse.java). */
export interface ProductDetail {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  unit: string;
  /** ISO date (YYYY-MM-DD). */
  harvestDate: string;
  imageUrls: string[];
  categoryName: string;
  farmer: FarmerSummary;
}
