package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import java.time.LocalDate;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.ftb.api.model.ProductStatus;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private UUID farmerId;
    private UUID categoryId;
    private String name;
    private String description;
    private Integer priceCents;
    private String unit;
    private LocalDate harvestDate;
    private Integer stockQuantity;
    private List<String> imageUrls;
    private ProductStatus listingStatus;
    private Instant createdAt;
}