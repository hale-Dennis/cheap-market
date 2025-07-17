package com.ftb.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RatingResponseDto {
    private UUID id;
    private int score;
    private String comment;
    private UUID orderId;
    private UUID farmerId;
    private Instant createdAt;
}