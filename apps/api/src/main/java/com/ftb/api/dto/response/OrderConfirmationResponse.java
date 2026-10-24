package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import com.ftb.api.model.Address;
import com.ftb.api.model.OrderStatus;
import com.ftb.api.model.PaymentStatus;
import com.ftb.api.model.FulfillmentType;


@Data
@Builder
public class OrderConfirmationResponse {
    private UUID id;
    private String orderNumber;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private List<OrderItemDto> items;
    private long itemsSubtotalCents;
    private long deliveryFeeCents;
    private long finalTotalCents;
    private FulfillmentType fulfillmentType;
    /** Set for home delivery. */
    private Address deliveryAddress;
    /** Set for pickup. */
    private PickupLocationResponseDto pickupLocation;
    private Instant createdAt;
}
