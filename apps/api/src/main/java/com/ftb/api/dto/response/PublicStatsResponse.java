package com.ftb.api.dto.response;


/**
 * Public numbers for the home page.
 * @param farmers Farmers who can sell (not suspended).
 * @param regions Regions with at least one listing buyers can see.
 */
public record PublicStatsResponse(long farmers, long regions) {
}
