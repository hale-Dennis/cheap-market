package com.ftb.api.dto.request;

import com.ftb.api.model.Address;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBuyerProfileRequest {
    private String fullName;

    @Valid
    private Address deliveryAddress;
}