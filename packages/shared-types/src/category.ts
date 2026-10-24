/** A produce category (see CategoryResponse.java). */
export interface Category {
  id: string;
  name: string;
}

/** Request body for POST /admin/categories and PUT /admin/categories/{id}. */
export interface CategoryRequest {
  name: string;
}
