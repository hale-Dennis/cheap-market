package com.ftb.api.dto.response;

import com.ftb.api.model.DisputeStatus;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AdminDisputeDetailDto {
    private UUID id;
    private UUID orderId;
    private String buyerName;
    private String buyerEmail;
    private String buyerPhoneNumber;
    private DisputeStatus status;
    private String reason;
    private String resolutionNotes;
    private Instant createdAt;
}