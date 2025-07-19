package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailResponse {
    private UUID id;
    private String name;
    private String description;
    private Integer priceCents;
    private String unit;
    private LocalDate harvestDate;
    private List<String> imageUrls;
    private FarmerInfo farmer;
}