package com.ftb.api.controller.admin;

import com.ftb.api.dto.request.UpdateDisputeRequestDto;
import com.ftb.api.dto.response.AdminDisputeDetailDto;
import com.ftb.api.dto.response.AdminDisputeSummaryDto;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.service.DisputeService;
import com.ftb.api.util.ResponseHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/disputes")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDisputeController {

    private final DisputeService disputeService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<AdminDisputeSummaryDto>>> getAllDisputes(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PaginatedResponse<AdminDisputeSummaryDto> disputes = disputeService.getAllDisputes(pageable);
        return ResponseHandler.successResponse("All disputes retrieved successfully.", HttpStatus.OK, disputes);
    }

    @GetMapping("/{disputeId}")
    public ResponseEntity<ApiResponse<AdminDisputeDetailDto>> getDisputeById(@PathVariable UUID disputeId) {
        AdminDisputeDetailDto dispute = disputeService.getDisputeById(disputeId);
        return ResponseHandler.successResponse("Dispute details retrieved successfully.", HttpStatus.OK, dispute);
    }

    @PutMapping("/{disputeId}")
    public ResponseEntity<ApiResponse<AdminDisputeDetailDto>> updateDispute(
            @PathVariable UUID disputeId,
            @Valid @RequestBody UpdateDisputeRequestDto request) {
        AdminDisputeDetailDto updatedDispute = disputeService.updateDispute(disputeId, request);
        return ResponseHandler.successResponse("Dispute updated successfully.", HttpStatus.OK, updatedDispute);
    }
}