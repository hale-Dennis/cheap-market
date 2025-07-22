package com.ftb.api.controller.admin;

import com.ftb.api.dto.request.UpdateFarmerRequest;
import com.ftb.api.util.ResponseHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.ftb.api.service.FarmerService;
import org.springframework.http.HttpStatus;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import com.ftb.api.dto.response.FarmerResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.dto.request.CreateFarmerRequest;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.UUID;


@RestController
@RequestMapping("/api/v1/admin/farmers")
@RequiredArgsConstructor
public class FarmerController {

    private final FarmerService farmerService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FarmerResponse>> createFarmer(@Valid @RequestBody CreateFarmerRequest request) {

        FarmerResponse farmerResponse = farmerService.createFarmer(request);
        return ResponseHandler.successResponse("Farmer account created successfully.", HttpStatus.CREATED, farmerResponse);
    }

    /**
     * Retrieves a paginated list of all registered farmers.
     * Accessible only by users with the 'ADMIN' role.
     * @param pageable Automatically populated by Spring from request params (?page, ?size, ?sort).
     * @return A ResponseEntity containing the paginated list of farmers.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaginatedResponse<FarmerResponse>>> getAllFarmers(
            @PageableDefault(size = 20) Pageable pageable
    ) {

        PaginatedResponse<FarmerResponse> paginatedResponse = farmerService.getAllFarmers(pageable);
        return ResponseHandler.successResponse("Successfully retrieved farmer list.", HttpStatus.OK, paginatedResponse);
    }

    @PutMapping("/{farmerId}")
    public ResponseEntity<ApiResponse<FarmerResponse>> updateFarmer(
            @PathVariable UUID farmerId,
            @Valid @RequestBody UpdateFarmerRequest request) {
        FarmerResponse updatedFarmer = farmerService.updateFarmer(farmerId, request);
        return ResponseHandler.successResponse("Farmer account updated successfully.", HttpStatus.OK, updatedFarmer);
    }

    @DeleteMapping("/{farmerId}")
    public ResponseEntity<Void> deleteFarmer(@PathVariable UUID farmerId) {
        farmerService.deleteFarmer(farmerId);
        return ResponseEntity.noContent().build();
    }
}