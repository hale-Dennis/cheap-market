package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import java.time.Instant;
import java.math.BigDecimal;
import com.ftb.api.model.OrderStatus;


@Data
@Builder
public class OrderSummaryResponseDto {
    private UUID id;
    private Instant createdAt;
    private long finalTotal;
    private OrderStatus status;
}