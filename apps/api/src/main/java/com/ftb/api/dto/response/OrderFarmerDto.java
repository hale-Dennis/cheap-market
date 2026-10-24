package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


/** A farmer who supplied part of an order, with the buyer's rating of them for that order if any. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderFarmerDto {
    private UUID farmerId;
    private String fullName;
    /** Null until the buyer rates this farmer for the order. */
    private RatingResponseDto rating;
}
