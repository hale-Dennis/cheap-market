package com.ftb.api.dto.request;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import com.ftb.api.validation.ValidRegion;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Full name cannot be blank")
    @Size(max = 255, message = "Full name must be at most 255 characters")
    private String fullName;

    @NotBlank(message = "Email cannot be blank")
    // Require a dot in the domain: the default @Email also accepts addresses like "jane@localhost".
    @Email(regexp = ".+@.+\\..+", message = "Please provide a valid email address")
    @Size(max = 255, message = "Email must be at most 255 characters")
    private String email;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    // BCrypt only uses the first 72 bytes and Spring's encoder rejects longer input.
    @Size(max = 72, message = "Password must be at most 72 characters long")
    @Pattern.List({
            @Pattern(regexp = ".*[A-Z].*", message = "Password must contain at least one uppercase letter"),
            @Pattern(regexp = ".*[0-9].*", message = "Password must contain at least one number")
    })
    private String password;

    @NotBlank(message = "Region cannot be blank")
    @ValidRegion
    private String region;
}