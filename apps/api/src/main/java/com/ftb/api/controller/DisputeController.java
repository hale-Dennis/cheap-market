package com.ftb.api.controller;

import com.ftb.api.util.ResponseHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.ftb.api.service.DisputeService;
import org.springframework.http.HttpStatus;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import com.ftb.api.dto.response.DisputeResponseDto;
import com.ftb.api.dto.request.CreateDisputeRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;


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
        return ResponseHandler.successResponse("Dispute submitted successfully.", HttpStatus.CREATED, newDispute);
    }
}