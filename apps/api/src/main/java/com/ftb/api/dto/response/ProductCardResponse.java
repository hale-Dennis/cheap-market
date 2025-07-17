package com.ftb.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

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