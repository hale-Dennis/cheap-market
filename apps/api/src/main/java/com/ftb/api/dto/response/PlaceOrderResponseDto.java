package com.ftb.api.dto.response;

import lombok.Data;
import java.util.UUID;
import lombok.AllArgsConstructor;


@Data
@AllArgsConstructor
public class PlaceOrderResponseDto {
    private UUID orderId;
}