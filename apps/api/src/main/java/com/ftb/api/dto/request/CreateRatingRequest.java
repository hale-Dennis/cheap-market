package com.ftb.api.dto.request;

import lombok.Data;
import java.util.UUID;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;


@Data
public class CreateRatingRequest {

    @NotNull(message = "Order ID cannot be null")
    private UUID orderId;

    @NotNull(message = "Score cannot be null")
    @Min(value = 1, message = "Score must be at least 1")
    @Max(value = 5, message = "Score must not exceed 5")
    private Integer score;

    @Size(max = 300, message = "Comment cannot exceed 300 characters")
    private String comment;
}