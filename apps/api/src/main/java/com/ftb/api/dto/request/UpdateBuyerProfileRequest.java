package com.ftb.api.dto.request;

import lombok.Data;
import lombok.Builder;
import jakarta.validation.Valid;
import lombok.NoArgsConstructor;
import com.ftb.api.model.Address;
import lombok.AllArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBuyerProfileRequest {
    private String fullName;

    @Valid
    private Address deliveryAddress;
}