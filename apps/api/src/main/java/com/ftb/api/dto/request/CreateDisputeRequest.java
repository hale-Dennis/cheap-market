package com.ftb.api.dto.request;

import lombok.Data;
import java.util.UUID;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;


@Data
public class CreateDisputeRequest {

    @NotNull(message = "Order ID cannot be null")
    private UUID orderId;

    @NotBlank(message = "Reason for dispute cannot be blank")
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;
}