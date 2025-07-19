package com.ftb.api.dto.response;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import java.time.Instant;
import com.ftb.api.model.DisputeStatus;


@Data
@Builder
public class DisputeResponseDto {
    private UUID id;
    private UUID orderId;
    private DisputeStatus status;
    private String reason;
    private Instant createdAt;
}