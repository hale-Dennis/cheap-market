package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.List;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponseDto {
    private List<CartItemDto> items;
    private int totalItems;
    private long subtotalCents;
}