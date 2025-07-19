package com.ftb.api.dto.response;

import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import lombok.NoArgsConstructor;
import com.ftb.api.model.Address;
import lombok.AllArgsConstructor;


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