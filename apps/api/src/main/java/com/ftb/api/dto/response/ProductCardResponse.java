package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.UUID;
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
    private String primaryImageUrl;
}