package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.UUID;


/** A farmer's overall rating, as shown on their products. */
@Data
@Builder
public class FarmerRatingSummaryDto {
    private UUID farmerId;
    /** Null until the farmer has been rated. */
    private Double averageRating;
    private int ratingCount;
}
