package com.ftb.api.dto.response;

import com.ftb.api.model.DisputeStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class DisputeResponseDto {
    private UUID id;
    private UUID orderId;
    private DisputeStatus status;
    private String reason;
    private Instant createdAt;
}