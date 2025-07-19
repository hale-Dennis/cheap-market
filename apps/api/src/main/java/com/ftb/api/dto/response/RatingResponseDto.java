package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import java.time.Instant;


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