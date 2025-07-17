package com.ftb.api.dto.response;


import com.ftb.api.model.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private UUID farmerId;
    private UUID categoryId;
    private String name;
    private Integer priceCents;
    private String unit;
    private List<String> imageUrls;
    private ProductStatus listingStatus;
    private Instant createdAt;
}