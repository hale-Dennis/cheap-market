package com.ftb.api.controller;

import java.util.List;
import lombok.RequiredArgsConstructor;
import com.ftb.api.dto.response.ApiResponse;
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

    @GetMapping
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<ApiResponse<List<PickupLocationResponseDto>>> getPickupLocationsByRegion(
            @RequestParam String region
    ) {
        List<PickupLocationResponseDto> locations = pickupLocationService.getLocationsByRegion(region);
        ApiResponse<List<PickupLocationResponseDto>> response = ApiResponse.<List<PickupLocationResponseDto>>builder()
                .status(200)
                .message("Pickup locations retrieved successfully.")
                .data(locations)
                .build();
        return ResponseEntity.ok(response);
    }
}