/** Body of POST /ratings: one farmer from one of the buyer's completed orders. */
export interface CreateRatingRequest {
  orderId: string;
  farmerId: string;
  /** Whole stars, 1–5. */
  score: number;
  /** Optional, up to RATING_COMMENT_MAX characters. */
  comment?: string;
}

export const RATING_COMMENT_MAX = 300;

/** A submitted rating (see RatingResponseDto.java). */
export interface Rating {
  id: string;
  score: number;
  comment: string | null;
  orderId: string;
  farmerId: string;
  createdAt: string;
}

/** Response of GET /ratings?farmerId= (see FarmerRatingSummaryDto.java). */
export interface FarmerRatingSummary {
  farmerId: string;
  /** Null until the farmer has been rated. */
  averageRating: number | null;
  ratingCount: number;
}

/** Error codes from POST /ratings. */
export type CreateRatingErrorCode = 'ORDER_NOT_COMPLETED' | 'FARMER_NOT_IN_ORDER' | 'ALREADY_RATED';
