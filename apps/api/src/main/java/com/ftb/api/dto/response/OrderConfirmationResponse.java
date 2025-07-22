package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import com.ftb.api.model.OrderStatus;
import com.ftb.api.model.FulfillmentType;


@Data
@Builder
public class OrderConfirmationResponse {
    private UUID id;
    private OrderStatus status;
    private List<OrderItemDto> items;
    private long itemsSubtotalCents;
    private long deliveryFeeCents;
    private long finalTotalCents;
    private FulfillmentType fulfillmentType;
    private Instant createdAt;
}