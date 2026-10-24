package com.ftb.api.dto.request;

import lombok.Data;
import lombok.Builder;
import jakarta.validation.Valid;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.Size;
import com.ftb.api.validation.ValidRegion;
import jakarta.validation.constraints.NotBlank;


/** Replaces the buyer's editable profile fields. Email is the login identifier and cannot be changed here. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBuyerProfileRequest {

    @NotBlank(message = "Full name cannot be blank")
    @Size(max = 255, message = "Full name must be at most 255 characters")
    private String fullName;

    @NotBlank(message = "Region cannot be blank")
    @ValidRegion
    private String region;

    /** Null removes the saved delivery address. */
    @Valid
    private AddressRequest deliveryAddress;
}
