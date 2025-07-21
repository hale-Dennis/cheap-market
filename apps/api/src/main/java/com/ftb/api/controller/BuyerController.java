package com.ftb.api.controller;

import com.ftb.api.util.ResponseHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.ftb.api.service.UserService;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ftb.api.dto.response.BuyerProfileResponse;
import org.springframework.security.core.Authentication;
import com.ftb.api.dto.request.UpdateBuyerProfileRequest;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/api/v1/buyer")
@RequiredArgsConstructor
public class BuyerController {

    private final UserService userService;

    @GetMapping("/profile")
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<ApiResponse<BuyerProfileResponse>> getProfile(Authentication authentication) {
        String email = authentication.getName();
        BuyerProfileResponse profile = userService.getBuyerProfile(email);
        return ResponseHandler.successResponse("Profile retrieved successfully.", HttpStatus.OK, profile);
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<ApiResponse<BuyerProfileResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateBuyerProfileRequest request
    ) {
        String email = authentication.getName();
        BuyerProfileResponse updatedProfile = userService.updateBuyerProfile(email, request);
        return ResponseHandler.successResponse("Profile updated successfully.", HttpStatus.OK, updatedProfile);
    }
}