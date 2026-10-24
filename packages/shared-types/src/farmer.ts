import type { RegionCode } from './regions';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED';

/** Request body for POST /admin/farmers (see CreateFarmerRequest.java). */
export interface CreateFarmerRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  region: RegionCode;
}

/** A farmer as returned by the admin farmer endpoints (see FarmerResponse.java). */
export interface Farmer {
  id: string;
  fullName: string;
  email: string;
  /** E.164, e.g. +233241234567. */
  phoneNumber: string;
  region: string;
  accountStatus: AccountStatus;
  createdAt: string;
}
