package com.ftb.api.dto.request;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.ftb.api.validation.ValidRegion;
import com.ftb.api.validation.GhanaianPhoneNumber;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFarmerRequest {

    @NotBlank(message = "Full name cannot be blank")
    @Size(max = 255, message = "Full name must be at most 255 characters")
    private String fullName;

    /** Optional: many farmers have no email address. */
    @Email(message = "A valid email address is required")
    private String email;

    @NotBlank(message = "Phone number cannot be blank")
    @GhanaianPhoneNumber
    private String phoneNumber;

    @NotBlank(message = "Region cannot be blank")
    @ValidRegion
    private String region;
}