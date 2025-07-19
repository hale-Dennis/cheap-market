package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
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
    private Integer priceCents;
    private String unit;
    private List<String> imageUrls;
    private ProductStatus listingStatus;
    private Instant createdAt;
}