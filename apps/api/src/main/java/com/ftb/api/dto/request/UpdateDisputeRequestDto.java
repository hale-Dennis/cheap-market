package com.ftb.api.dto.request;

import com.ftb.api.model.DisputeStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateDisputeRequestDto {

    @NotNull(message = "Status cannot be null")
    private DisputeStatus status;

    @Size(max = 1000, message = "Resolution notes cannot exceed 1000 characters")
    private String resolutionNotes;
}