package com.ftb.api.dto.response;


/**
 * Headline numbers for the admin dashboard.
 * @param farmers          Every registered farmer, suspended or not.
 * @param liveListings     Listings buyers can see right now.
 * @param ordersInProgress Orders not yet completed or disputed.
 * @param openDisputes     Reported issues that aren't resolved.
 */
public record AdminStatsResponse(long farmers, long liveListings, long ordersInProgress, long openDisputes) {
}
