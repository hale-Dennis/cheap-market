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
import org.springframework.data.domain.Sort;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.UUID;


@RestController
@RequestMapping("/api/v1/admin/farmers")
@RequiredArgsConstructor
public class FarmerController {

    static final int DEFAULT_PAGE_SIZE = 20;
    static final int MAX_PAGE_SIZE = 100;
    // Fixed, total ordering so pages never overlap or skip farmers.
    static final Sort FARMER_ORDER = Sort.by(
            Sort.Order.desc("createdAt"), Sort.Order.asc("fullName"), Sort.Order.asc("id"));

    private final FarmerService farmerService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FarmerResponse>> createFarmer(@Valid @RequestBody CreateFarmerRequest request) {

        FarmerResponse farmerResponse = farmerService.createFarmer(request);
        return ResponseHandler.successResponse("Farmer account created successfully.", HttpStatus.CREATED, farmerResponse);
    }

    /**
     * Retrieves a page of registered farmers, newest first.
     * Accessible only by users with the 'ADMIN' role.
     * @param page Zero-based page number.
     * @param size Page size, 1 to {@value #MAX_PAGE_SIZE}.
     * @return A ResponseEntity containing the paginated list of farmers.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaginatedResponse<FarmerResponse>>> getAllFarmers(
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "must be 0 or greater") int page,
            @RequestParam(defaultValue = "" + DEFAULT_PAGE_SIZE)
            @Min(value = 1, message = "must be at least 1")
            @Max(value = MAX_PAGE_SIZE, message = "must be at most " + MAX_PAGE_SIZE) int size
    ) {
        Pageable pageable = PageRequest.of(page, size, FARMER_ORDER);

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