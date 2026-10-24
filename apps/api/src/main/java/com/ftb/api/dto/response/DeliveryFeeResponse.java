package com.ftb.api.dto.response;


/** Home-delivery fee for a region, in pesewas. */
public record DeliveryFeeResponse(String region, int feeCents) {
}
