package com.ftb.api.controller.admin;

import com.ftb.api.dto.request.CreatePickupLocationRequest;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.dto.response.PickupLocationResponseDto;
import com.ftb.api.service.PickupLocationService;
import com.ftb.api.util.ResponseHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/pickup-locations")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPickupLocationController {

    private final PickupLocationService pickupLocationService;

    @PostMapping
    public ResponseEntity<ApiResponse<PickupLocationResponseDto>> createLocation(
            @Valid @RequestBody CreatePickupLocationRequest request) {
        PickupLocationResponseDto newLocation = pickupLocationService.createLocation(request);
        return ResponseHandler.successResponse("Pickup location created successfully.", HttpStatus.CREATED, newLocation);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<PickupLocationResponseDto>>> listAllLocations(Pageable pageable) {
        PaginatedResponse<PickupLocationResponseDto> locations = pickupLocationService.listAllLocations(pageable);
        return ResponseHandler.successResponse("Pickup locations retrieved successfully.", HttpStatus.OK, locations);
    }

    @PutMapping("/{locationId}")
    public ResponseEntity<ApiResponse<PickupLocationResponseDto>> updateLocation(
            @PathVariable UUID locationId,
            @Valid @RequestBody CreatePickupLocationRequest request) {
        PickupLocationResponseDto updatedLocation = pickupLocationService.updateLocation(locationId, request);
        return ResponseHandler.successResponse("Pickup location updated successfully.", HttpStatus.OK, updatedLocation);
    }

    @DeleteMapping("/{locationId}")
    public ResponseEntity<Void> deleteLocation(@PathVariable UUID locationId) {
        pickupLocationService.deleteLocation(locationId);
        return ResponseEntity.noContent().build();
    }
}