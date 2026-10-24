export type UserRole = 'BUYER' | 'FARMER' | 'ADMIN';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

/** Claims carried by the access token issued by the API (see JwtService.java). */
export interface JwtPayload {
  /** The user's email address. */
  sub: string;
  role: UserRole;
  /** Issued-at, seconds since epoch. */
  iat: number;
  /** Expiry, seconds since epoch. */
  exp: number;
}
