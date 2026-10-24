package com.ftb.api.dto.response;

import java.util.UUID;
import lombok.Data;
import lombok.AllArgsConstructor;


@Data
@AllArgsConstructor
public class PlaceOrderResponseDto {
    private UUID orderId;
    private String orderNumber;
    /** True when this repeats an earlier request with the same Idempotency-Key; no new order was created. */
    private boolean duplicate;
}
