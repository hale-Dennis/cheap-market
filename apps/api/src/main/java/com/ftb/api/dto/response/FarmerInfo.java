package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerInfo {
    private String fullName;
    private String region;
    /** Null or 0 until the farmer has been rated. */
    private Double averageRating;
    private Integer ratingCount;
}