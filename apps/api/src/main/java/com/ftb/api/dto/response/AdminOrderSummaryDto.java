package com.ftb.api.dto.response;

import com.ftb.api.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AdminOrderSummaryDto {
    private UUID id;
    private Instant createdAt;
    private BigDecimal finalTotal;
    private OrderStatus status;
    private String buyerName;
}