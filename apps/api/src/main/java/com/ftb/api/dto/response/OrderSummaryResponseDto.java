package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import java.math.BigDecimal;
import com.ftb.api.model.OrderStatus;
import com.ftb.api.model.FulfillmentType;


@Data
@Builder
public class OrderSummaryResponseDto {
    private UUID id;
    private String orderNumber;
    private Instant createdAt;
    private long finalTotalCents;
    private OrderStatus status;
    private FulfillmentType fulfillmentType;
    /** Total quantity across the order's items. */
    private int itemCount;
    /** Farmers the buyer can still rate (completed orders only); empty otherwise. */
    @Builder.Default
    private List<OrderFarmerDto> farmersToRate = List.of();
}