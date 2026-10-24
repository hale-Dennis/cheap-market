import type { CreateDisputeRequest, Dispute } from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

/** Reports a problem with one of the buyer's completed orders; the order becomes DISPUTED. */
export function createDispute(request: CreateDisputeRequest): Promise<Dispute> {
  return apiRequest<Dispute>('/disputes', { method: 'POST', body: JSON.stringify(request) });
}
