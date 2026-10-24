package com.ftb.api.dto.request;

import lombok.Data;
import com.ftb.api.model.AccountStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.ftb.api.validation.ValidRegion;
import com.ftb.api.validation.GhanaianPhoneNumber;


@Data
public class UpdateFarmerRequest {

    @NotBlank(message = "Full name cannot be blank")
    @Size(max = 255, message = "Full name must be at most 255 characters")
    private String fullName;

    @NotBlank(message = "Phone number cannot be blank")
    @GhanaianPhoneNumber
    private String phoneNumber;

    @NotBlank(message = "Region cannot be blank")
    @ValidRegion
    private String region;

    @NotNull(message = "Account status cannot be null")
    private AccountStatus accountStatus;
}