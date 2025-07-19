package com.ftb.api.dto.response;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


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