package com.ftb.api.controller;

import com.ftb.api.dto.request.CreateDisputeRequest;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.DisputeResponseDto;
import com.ftb.api.service.DisputeService;
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
@RequestMapping("/api/v1/disputes")
@PreAuthorize("hasRole('BUYER')")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    @PostMapping
    public ResponseEntity<ApiResponse<DisputeResponseDto>> createDispute(
            Authentication authentication,
            @Valid @RequestBody CreateDisputeRequest request
    ) {
        DisputeResponseDto newDispute = disputeService.createDispute(authentication.getName(), request);
        ApiResponse<DisputeResponseDto> response = ApiResponse.<DisputeResponseDto>builder()
                .status(HttpStatus.CREATED.value())
                .message("Dispute submitted successfully.")
                .data(newDispute)
                .build();
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}