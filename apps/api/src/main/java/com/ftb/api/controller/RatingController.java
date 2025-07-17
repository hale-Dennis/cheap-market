package com.ftb.api.controller;

import com.ftb.api.dto.request.CreateRatingRequest;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.RatingResponseDto;
import com.ftb.api.service.RatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ratings")
@PreAuthorize("hasRole('BUYER')")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    public ResponseEntity<ApiResponse<RatingResponseDto>> createRating(
            Authentication authentication,
            @Valid @RequestBody CreateRatingRequest request
    ) {
        RatingResponseDto newRating = ratingService.createRating(authentication.getName(), request);
        ApiResponse<RatingResponseDto> response = ApiResponse.<RatingResponseDto>builder()
                .status(HttpStatus.CREATED.value())
                .message("Rating submitted successfully.")
                .data(newRating)
                .build();
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}