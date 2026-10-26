/** GET /stats: public numbers for the home page. */
export interface PublicStats {
  /** Farmers who can sell (not suspended). */
  farmers: number;
  /** Regions with at least one listing buyers can see. */
  regions: number;
}

/** GET /admin/stats: headline numbers for the admin dashboard. */
export interface AdminStats {
  /** Every registered farmer, suspended or not. */
  farmers: number;
  /** Listings buyers can see right now. */
  liveListings: number;
  /** Orders not yet completed or disputed. */
  ordersInProgress: number;
  /** Reported issues that aren't resolved. */
  openDisputes: number;
}
