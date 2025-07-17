package com.ftb.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class OrderItemDto {
    private UUID productId;
    private String name;
    private int quantity;
    private Integer priceAtPurchase;
}