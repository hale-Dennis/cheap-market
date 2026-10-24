package com.ftb.api.dto.response;

import lombok.Data;
import java.util.List;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponseDto {
    /** In the order they were added. */
    private List<CartItemDto> items;
    /** Sum of quantities across all items, including unavailable ones. */
    private int totalItems;
    /** Total of the items that are still available, at current prices. */
    private long subtotalCents;
}
