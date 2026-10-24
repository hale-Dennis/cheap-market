package com.ftb.api.dto.request;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;


/** A delivery address as submitted by a user. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressRequest {

    @NotBlank(message = "Street cannot be blank")
    @Size(max = 255, message = "Street must be at most 255 characters")
    private String street;

    @NotBlank(message = "Town cannot be blank")
    @Size(max = 100, message = "Town must be at most 100 characters")
    private String town;

    /** Optional Ghana Post GPS digital address, e.g. AK-484-9321. */
    @Pattern(regexp = "^$|^\\s*[A-Za-z]{2}-\\d{3,4}-\\d{4}\\s*$",
            message = "GPS address must look like AK-484-9321")
    private String gpsAddress;
}
