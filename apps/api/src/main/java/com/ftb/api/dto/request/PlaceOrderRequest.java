package com.ftb.api.dto.request;

import com.ftb.api.model.FulfillmentType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class PlaceOrderRequest {

    @NotNull(message = "Fulfillment type cannot be null")
    private FulfillmentType fulfillmentType;

    private UUID pickupLocationId;
}