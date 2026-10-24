package com.ftb.api.controller;

import java.util.UUID;
import com.ftb.api.util.ResponseHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.ftb.api.service.RatingService;
import org.springframework.http.HttpStatus;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import com.ftb.api.dto.response.RatingResponseDto;
import com.ftb.api.dto.request.CreateRatingRequest;
import com.ftb.api.dto.response.FarmerRatingSummaryDto;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/api/v1/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<ApiResponse<RatingResponseDto>> createRating(
            Authentication authentication,
            @Valid @RequestBody CreateRatingRequest request
    ) {
        RatingResponseDto newRating = ratingService.createRating(authentication.getName(), request);
        return ResponseHandler.successResponse("Rating submitted successfully.", HttpStatus.CREATED, newRating);
    }

    /** A farmer's average rating and count; public, like the product pages that show it. */
    @GetMapping
    public ResponseEntity<ApiResponse<FarmerRatingSummaryDto>> getFarmerRating(@RequestParam UUID farmerId) {
        return ResponseHandler.successResponse("Farmer rating retrieved successfully.", HttpStatus.OK,
                ratingService.getFarmerRating(farmerId));
    }
}
