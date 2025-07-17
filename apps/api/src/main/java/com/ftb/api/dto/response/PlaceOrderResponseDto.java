package com.ftb.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class PlaceOrderResponseDto {
    private UUID orderId;
}