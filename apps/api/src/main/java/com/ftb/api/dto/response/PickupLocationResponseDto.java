package com.ftb.api.dto.response;

import com.ftb.api.model.Address;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickupLocationResponseDto {
    private UUID id;
    private String name;
    private Address address;
    private String region;
    private String operatingHours;
}