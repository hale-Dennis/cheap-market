package com.ftb.api.dto.response;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;


@Data
@Builder
public class OrderItemDto {
    private UUID productId;
    private String name;
    private int quantity;
    private Integer priceAtPurchaseCents;
}