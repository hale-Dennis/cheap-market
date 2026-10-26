package com.ftb.api.dto.response;


/** How many of the buyer's orders are in each order-history tab. */
public record OrderStatusCountsResponse(long all, long active, long completed, long disputed) {
}
