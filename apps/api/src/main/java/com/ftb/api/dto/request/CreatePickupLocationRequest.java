package com.ftb.api.dto.request;

import lombok.Data;
import jakarta.validation.Valid;
import com.ftb.api.model.Address;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;


@Data
public class CreatePickupLocationRequest {

    @NotBlank(message = "Location name cannot be blank")
    private String name;

    @NotNull(message = "Address cannot be null")
    @Valid
    private Address address;

    @NotBlank(message = "Region cannot be blank")
    private String region;

    private String operatingHours;
}