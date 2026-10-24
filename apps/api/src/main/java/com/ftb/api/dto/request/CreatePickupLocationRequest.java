package com.ftb.api.dto.request;

import lombok.Data;
import jakarta.validation.Valid;
import com.ftb.api.model.Address;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import com.ftb.api.validation.ValidRegion;


@Data
public class CreatePickupLocationRequest {

    @NotBlank(message = "Location name cannot be blank")
    private String name;

    @NotNull(message = "Address cannot be null")
    @Valid
    private Address address;

    @NotBlank(message = "Region cannot be blank")
    @ValidRegion
    private String region;

    private String operatingHours;
}