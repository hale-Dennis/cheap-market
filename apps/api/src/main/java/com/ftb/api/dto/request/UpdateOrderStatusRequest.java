package com.ftb.api.dto.request;

import lombok.Data;
import com.ftb.api.model.OrderStatus;
import jakarta.validation.constraints.NotNull;


@Data
public class UpdateOrderStatusRequest {

    @NotNull(message = "Order status cannot be null")
    private OrderStatus status;
}