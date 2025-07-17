package com.ftb.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

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