package com.ftb.api.dto.response;

import com.ftb.api.model.DisputeStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AdminDisputeSummaryDto {
    private UUID id;
    private UUID orderId;
    private String buyerName;
    private DisputeStatus status;
    private Instant createdAt;
}