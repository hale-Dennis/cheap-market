package com.ftb.api.dto.request;

import lombok.Data;
import com.ftb.api.model.AccountStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;


@Data
public class UpdateFarmerRequest {

    @NotBlank(message = "Full name cannot be blank")
    private String fullName;

    @NotBlank(message = "Phone number cannot be blank")
    private String phoneNumber;

    @NotBlank(message = "Region cannot be blank")
    private String region;

    @NotNull(message = "Account status cannot be null")
    private AccountStatus accountStatus;
}