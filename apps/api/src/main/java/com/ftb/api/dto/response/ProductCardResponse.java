package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import java.time.LocalDate;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCardResponse {
    private UUID id;
    private String name;
    private Integer priceCents;
    private String unit;
    /** First image of the listing, or null if it has none. */
    private String primaryImageUrl;
    private LocalDate harvestDate;
    private String farmerName;
    private String categoryName;
}