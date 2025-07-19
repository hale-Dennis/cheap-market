package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import com.ftb.api.model.Address;
import lombok.AllArgsConstructor;


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