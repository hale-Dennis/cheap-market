package com.ftb.api.dto.response;

import com.ftb.api.model.FulfillmentType;
import com.ftb.api.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class OrderConfirmationResponse {
    private UUID id;
    private OrderStatus status;
    private List<OrderItemDto> items;
    private long itemsSubtotal;
    private long deliveryFee;
    private long finalTotal;
    private FulfillmentType fulfillmentType;
    private Instant createdAt;
}