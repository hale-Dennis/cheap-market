package com.ftb.api.dto.response;

import com.ftb.api.model.Address;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuyerProfileResponse {
    private String fullName;
    private String email;
    private String region;
    private Address deliveryAddress;
}