import type { RegionCode } from './regions';

/** A delivery address (see Address.java / AddressRequest.java). */
export interface Address {
  street: string;
  town: string;
  /** Ghana Post GPS digital address, e.g. AK-484-9321. */
  gpsAddress?: string | null;
}

/** Request body for POST /auth/register (see RegisterRequest.java). */
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  region: RegionCode;
}

/** Response of GET/PUT /buyer/profile (see BuyerProfileResponse.java). */
export interface BuyerProfile {
  fullName: string;
  email: string;
  region: string;
  deliveryAddress: Address | null;
}

/** Request body for PUT /buyer/profile. Replaces all editable fields; null removes the address. */
export interface UpdateBuyerProfileRequest {
  fullName: string;
  region: RegionCode;
  deliveryAddress: Address | null;
}
