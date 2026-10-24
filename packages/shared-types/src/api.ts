/** Envelope returned by every backend endpoint (see ApiResponse.java). */
export interface ApiResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  data?: T;
}

/** A page of results (see PaginatedResponse.java). `currentPage` is zero-based. */
export interface PaginatedResponse<T> {
  content: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}
