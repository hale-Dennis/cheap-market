/** Envelope returned by every backend endpoint (see ApiResponse.java). */
export interface ApiResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  data?: T;
}
