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
    private String unit;
    private String farmerName;
    /** The product's current price per unit. */
    private Integer priceCents;
    private int quantity;
    /** priceCents × quantity. */
    private long lineTotalCents;
    private String primaryImageUrl;
    /** False once the listing is no longer for sale (inactive, sold out, or the farmer is suspended). */
    private boolean available;
}
