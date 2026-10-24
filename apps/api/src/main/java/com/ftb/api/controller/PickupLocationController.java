package com.ftb.api.controller;

import java.util.List;

import com.ftb.api.util.ResponseHandler;
import lombok.RequiredArgsConstructor;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import java.time.Duration;
import org.springframework.http.CacheControl;
import com.ftb.api.validation.ValidRegion;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import com.ftb.api.service.PickupLocationService;
import com.ftb.api.dto.response.PickupLocationResponseDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/api/v1/pickup-locations")
@RequiredArgsConstructor
public class PickupLocationController {

    private final PickupLocationService pickupLocationService;

    /** Pickup locations in a region, by name. Cached by the browser for 5 minutes. */
    @GetMapping
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<ApiResponse<List<PickupLocationResponseDto>>> getPickupLocationsByRegion(
            @RequestParam @NotBlank(message = "is required") @ValidRegion String region
    ) {
        List<PickupLocationResponseDto> locations = pickupLocationService.getLocationsByRegion(region);
        return ResponseEntity.ok()
                // Private: the endpoint requires sign-in, so shared caches must not store it.
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate())
                .body(ResponseHandler.successResponse("Pickup locations retrieved successfully.", HttpStatus.OK, locations).getBody());
    }
}