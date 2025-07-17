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
public class CartItemDto {
    private UUID productId;
    private String name;
    private Integer priceCentsAtAdd;
    private int quantity;
    private String primaryImageUrl;
}