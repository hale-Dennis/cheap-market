export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';

/** Body of POST /disputes: report a problem with one of the buyer's completed orders. */
export interface CreateDisputeRequest {
  orderId: string;
  /** Required, up to DISPUTE_REASON_MAX characters. */
  reason: string;
}

export const DISPUTE_REASON_MAX = 500;

/** A reported issue (see DisputeResponseDto.java). */
export interface Dispute {
  id: string;
  orderId: string;
  status: DisputeStatus;
  reason: string;
  createdAt: string;
}

/** Error codes from POST /disputes. */
export type CreateDisputeErrorCode = 'ORDER_NOT_COMPLETED' | 'ALREADY_DISPUTED';
